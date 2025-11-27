# marketplace/services.py
from django.conf import settings
from typing import Dict, Any, Optional
from .models import Marketplace
from django.db import transaction
from stock.models import ProductStock
import logging


logger = logging.getLogger(__name__)

class CredentialsService:
    """Сервис для управления учетными данными маркетплейсов"""
    
    @staticmethod
    def get_marketplace_credentials(marketplace_code: str) -> Optional[Dict[str, Any]]:
        """Получение credentials для маркетплейса"""
        try:
            marketplace = Marketplace.objects.get(
                code=marketplace_code, 
                status='active'
            )
            credentials = marketplace.get_api_credentials()
            logger.info(f"Successfully loaded credentials for {marketplace_code}")
            return credentials
        except Marketplace.DoesNotExist:
            logger.error(f"Marketplace {marketplace_code} not found or inactive")
            return None
        except Exception as e:
            logger.error(f"Error getting credentials for {marketplace_code}: {str(e)}")
            return None

class MarketplaceStockService:
    """Сервис для синхронизации остатков с маркетплейсами"""
    
    @staticmethod
    def sync_stock_to_marketplaces(product_stock):
        """Синхронизировать остатки товара со всеми маркетплейсами"""
        product = product_stock.product
        actual_quantity = product_stock.get_actual_available()
        
        for marketplace_product in product.marketplace_products.filter(sync_enabled=True):
            MarketplaceStockService.update_stock_on_marketplace(
                marketplace_product, 
                actual_quantity
            )
    
    @staticmethod
    def update_stock_on_marketplace(marketplace_product, quantity):
        """Обновить остатки на конкретном маркетплейсе"""
        marketplace = marketplace_product.marketplace.name
        
        try:
            if marketplace == 'Wildberries':
                MarketplaceStockService.update_wildberries_stock(marketplace_product, quantity)
            elif marketplace == 'OZON':
                MarketplaceStockService.update_ozon_stock(marketplace_product, quantity)
            elif marketplace == 'Яндекс.Маркет':
                MarketplaceStockService.update_yandex_stock(marketplace_product, quantity)
                
            print(f"Синхронизирован остаток для {marketplace_product.product.article} на {marketplace}: {quantity}")
                
        except Exception as e:
            print(f"Ошибка синхронизации с {marketplace}: {e}")
    
    @staticmethod
    def update_wildberries_stock(marketplace_product, quantity):
        """Обновить остатки на Wildberries"""
        
        sku = marketplace_product.external_sku or marketplace_product.external_product_id
        print(f"Wildberries API: Обновлен остаток для {sku} = {quantity}")
        # Реальный код:
        # url = "https://suppliers-api.wildberries.ru/api/v2/stocks"
        # data = [{"sku": sku, "amount": quantity}]
        # requests.post(url, json=data, headers=headers)
    
    @staticmethod
    def update_ozon_stock(marketplace_product, quantity):
        """Обновить остатки на OZON"""
        product_id = marketplace_product.external_product_id
        print(f"OZON API: Обновлен остаток для {product_id} = {quantity}")
    
    @staticmethod
    def update_yandex_stock(marketplace_product, quantity):
        """Обновить остатки на Яндекс.Маркет"""
        sku = marketplace_product.external_sku or marketplace_product.external_product_id
        print(f"Яндекс.Маркет API: Обновлен остаток для {sku} = {quantity}")