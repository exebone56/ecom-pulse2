import abc
import logging
from typing import List, Dict, Any
from django.utils import timezone
from asgiref.sync import sync_to_async

from order.models import Order, OrderItem
from marketplace.models import Marketplace, MarketplaceProduct
from product.models import Product
from marketplace.services import CredentialsService

logger = logging.getLogger(__name__)


class BaseParser(abc.ABC):
    """Абстрактный базовый класс для всех парсеров"""

    def __init__(self, marketplace_id: int = None, marketplace_code: str = None):
        if marketplace_id:
            self.marketplace = self._get_marketplace_by_id(marketplace_id)
            self.marketplace_code = self.marketplace.code
        elif marketplace_code:
            self.marketplace = self._get_marketplace_by_code(marketplace_code)
            self.marketplace_code = marketplace_code
        else:
            raise ValueError("Укажите marketplace_id или marketplace_code")
        
        self.credentials = self._load_credentials()
        self.processed_orders = 0

    def _get_marketplace_by_id(self, marketplace_id):
        try:
            return Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            raise ValueError(f"Marketplace с ID {marketplace_id} не найден")

    def _get_marketplace_by_code(self, marketplace_code):
        try:
            return Marketplace.objects.get(code=marketplace_code, status='active')
        except Marketplace.MultipleObjectsReturned:
            raise ValueError(f"Найдено несколько активных маркетплейсов с кодом {marketplace_code}. Используйте ID.")
        except Marketplace.DoesNotExist:
            raise ValueError(f"Marketplace {marketplace_code} не найден")

    def _load_credentials(self) -> Dict[str, Any]:
        return self.marketplace.get_api_credentials()

    def _get_marketplace_instance(self) -> Marketplace:
        """Получение экземпляра модели Marketplace"""
        try:
            return Marketplace.objects.get(code=self.marketplace_code)
        except Marketplace.DoesNotExist:
            raise ValueError(f"Marketplace {self.marketplace_code} not found")

    @abc.abstractmethod
    async def fetch_orders(self, **kwargs) -> List[Dict[str, Any]]:
        """Получение заказов из API"""
        pass

    @abc.abstractmethod
    def normalize_order_data(self, raw_order: Dict[str, Any]) -> Dict[str, Any]:
        """Нормализация данных заказа к единому формату"""
        pass

    async def parse_orders(self, **kwargs) -> int:
        """Основной метод парсинга заказов"""
        try:
            raw_orders = await self.fetch_orders(**kwargs)
            logger.info(f"Fetched {len(raw_orders)} orders from {self.marketplace.name}")

            for raw_order in raw_orders:
                await self.process_single_order(raw_order)

            # Обновляем время последней успешной синхронизации
            self.marketplace.last_successful_sync = timezone.now()
            await sync_to_async(self.marketplace.save)(update_fields=['last_successful_sync'])

            logger.info(f"Successfully processed {self.processed_orders} orders from {self.marketplace.name}")
            return self.processed_orders

        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg or "Unauthorized" in error_msg:
                logger.error(f"⚠️ 401 Unauthorized for {self.marketplace.name}. Check API credentials!")
            else:
                logger.error(f"Error parsing orders from {self.marketplace.name}: {error_msg}", exc_info=True)
            return 0

    async def process_single_order(self, raw_order: Dict[str, Any]):
        """Обработка одного заказа с сохранением в БД"""
        try:
            order_data = self.normalize_order_data(raw_order)
            external_id = order_data.get('external_id')
            if not external_id:
                logger.warning("Пропущен заказ без external_id")
                return

            # Подготовка данных для Order
            order_defaults = {
                'number': order_data.get('number', ''),
                'posting_number': order_data.get('posting_number', ''),
                'status': order_data.get('status', 'new'),
                'created_at_marketplace': order_data.get('created_at_marketplace'),
                'total_amount': order_data.get('total_amount', 0),
            }

            # Сохранение Order
            order, created = await sync_to_async(Order.objects.update_or_create)(
                external_id=external_id,
                marketplace=self.marketplace,
                defaults=order_defaults
            )

            # Обработка товаров
            items_data = order_data.get('items', [])
            for item_data in items_data:
                await self._process_order_item(order, item_data)

            self.processed_orders += 1
            logger.debug(f"{'Создан' if created else 'Обновлён'} заказ: {order.number or external_id}")

        except Exception as e:
            logger.error(f"Ошибка обработки заказа {raw_order.get('id', 'unknown')}: {str(e)}", exc_info=True)

    async def _process_order_item(self, order: Order, item_data: Dict[str, Any]):
        try:
            product_id = item_data.get('product_id')
            offer_id = item_data.get('offer_id')  # ← твой артикул
            if not product_id:
                logger.warning(f"Пропущен товар без product_id в заказе {order.external_id}")
                return

            # --- 1. Ищем Product по offer_id (артикулу) ---
            def get_product_by_offer_id():
                if offer_id:
                    try:
                        return Product.objects.get(article=offer_id)
                    except Product.DoesNotExist:
                        pass
                # Если не найден по offer_id — ищем по product_id как резерв
                try:
                    return Product.objects.get(article=str(product_id))
                except Product.DoesNotExist:
                    return None

            product = await sync_to_async(get_product_by_offer_id)()

            if not product:
                logger.warning(
                    f"Товар не найден в каталоге: product_id={product_id}, offer_id={offer_id}. "
                    f"Заказ {order.external_id} пропущен."
                )
                return  # ← не создаём, просто пропускаем

            # --- 2. Получаем или создаём MarketplaceProduct ---
            def get_or_create_marketplace_product():
                mp_product, created = MarketplaceProduct.objects.get_or_create(
                    product=product,
                    marketplace=self.marketplace,
                    defaults={
                        'external_product_id': str(product_id),
                        'external_sku': offer_id or '',
                        'price': item_data.get('price', 0),
                        'status': 'ACTIVE'
                    }
                )
                if not created:
                    # Обновляем цену
                    new_price = item_data.get('price')
                    if new_price is not None and new_price != mp_product.price:
                        mp_product.price = new_price
                        mp_product.save(update_fields=['price'])
                return mp_product

            marketplace_product = await sync_to_async(get_or_create_marketplace_product)()

            # --- 3. Создаём OrderItem ---
            def create_order_item():
                OrderItem.objects.update_or_create(
                    order=order,
                    product=marketplace_product,
                    defaults={
                        'quantity': item_data.get('quantity', 1),
                        'price': item_data.get('price', 0)
                    }
                )

            await sync_to_async(create_order_item)()

        except Exception as e:
            logger.error(f"Ошибка обработки товара {product_id} в заказе {order.external_id}: {str(e)}", exc_info=True)