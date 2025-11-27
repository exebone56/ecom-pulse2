# order/services.py
from django.db import transaction
from django.db.models import F
from stock.models import ProductStock
from marketplace.services import MarketplaceStockService

class StockManagementService:
    """Сервис для управления остатками при работе с заказами"""
    
    @staticmethod
    def get_marketplace_reserve_field(marketplace_name):
        """Получить название поля резерва для маркетплейса"""
        marketplace_map = {
            'Wildberries': 'reserved_wb',
            'OZON': 'reserved_ozon', 
            'Яндекс.Маркет': 'reserved_yandex'
        }
        return marketplace_map.get(marketplace_name, 'reserved_wb')
    
    @staticmethod
    def process_new_fbs_order(order):
        """Обработать новый FBS заказ - уменьшить доступное количество и добавить в резерв"""
        if not order.is_fbs():
            return
        
        with transaction.atomic():
            for item in order.items.all():
                product = item.product.product
                quantity = item.quantity
                marketplace_name = order.marketplace.name
                reserve_field = StockManagementService.get_marketplace_reserve_field(marketplace_name)
                
                stock, created = ProductStock.objects.get_or_create(
                    product=product,
                    defaults={
                        'available_quantity': 0,
                        reserve_field: 0
                    }
                )
                
                if stock.available_quantity < quantity:
                    raise ValueError(
                        f"Недостаточно товара {product.article}. "
                        f"Доступно: {stock.available_quantity}, требуется: {quantity}"
                    )
                
                update_kwargs = {
                    'available_quantity': F('available_quantity') - quantity,
                    reserve_field: F(reserve_field) + quantity
                }
                ProductStock.objects.filter(product=product).update(**update_kwargs)
                
                stock.refresh_from_db()
                
                MarketplaceStockService.sync_stock_to_marketplaces(stock)
    
    @staticmethod
    def process_delivery_status(order):
        """Обработать переход в статус доставки - убрать из резерва"""
        if not order.is_fbs():
            return
    
        with transaction.atomic():
            for item in order.items.all():
                product = item.product.product
                quantity = item.quantity
                marketplace_name = order.marketplace.name
                reserve_field = StockManagementService.get_marketplace_reserve_field(marketplace_name)
                
                try:
                    stock = ProductStock.objects.get(product=product)
                    
                    # Убираем из резерва (доступное количество уже уменьшено при создании заказа)
                    update_kwargs = {
                        reserve_field: F(reserve_field) - quantity
                    }
                    ProductStock.objects.filter(product=product).update(**update_kwargs)
                    
                    # Обновляем объект в памяти
                    stock.refresh_from_db()
                    
                    # Синхронизируем остатки с маркетплейсами
                    MarketplaceStockService.sync_stock_to_marketplaces(stock)
                    
                except ProductStock.DoesNotExist:
                    # Если нет записи об остатках, создаем с нулевыми значениями
                    stock = ProductStock.objects.create(
                        product=product,
                        available_quantity=0
                    )
                    # Устанавливаем резерв в отрицательное значение (для учета ошибок)
                    setattr(stock, reserve_field, -quantity)
                    stock.save()
    
    @staticmethod
    def cancel_fbs_order(order):
        """Отменить FBS заказ - вернуть доступное количество и убрать из резерва"""
        if not order.is_fbs():
            return
        
        with transaction.atomic():
            for item in order.items.all():
                product = item.product.product
                quantity = item.quantity
                marketplace_name = order.marketplace.name
                reserve_field = StockManagementService.get_marketplace_reserve_field(marketplace_name)
                
                try:
                    stock = ProductStock.objects.get(product=product)
                    
                    # Возвращаем доступное количество и убираем из резерва
                    update_kwargs = {
                        'available_quantity': F('available_quantity') + quantity,
                        reserve_field: F(reserve_field) - quantity
                    }
                    ProductStock.objects.filter(product=product).update(**update_kwargs)
                    
                    # Обновляем объект в памяти
                    stock.refresh_from_db()
                    
                    # Синхронизируем остатки с маркетплейсами
                    MarketplaceStockService.sync_stock_to_marketplaces(stock)
                    
                except ProductStock.DoesNotExist:
                    # Если нет записи об остатках, создаем с возвращенным количеством
                    stock = ProductStock.objects.create(
                        product=product,
                        available_quantity=quantity
                    )
                    MarketplaceStockService.sync_stock_to_marketplaces(stock)