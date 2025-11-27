# parsers/yandex_parser.py

from .base import BaseParser
from api.yandex_market_api import YandexMarketAPIClient
from typing import List, Dict, Any
import datetime
import logging

logger = logging.getLogger(__name__)

class YandexParser(BaseParser):
    """Парсер для Яндекс.Маркета"""
    
    def __init__(self, marketplace_id=None, marketplace_code: str = 'yandex_market'):
        super().__init__(marketplace_id=marketplace_id, marketplace_code=marketplace_code)
        self.api_client = YandexMarketAPIClient(
            oauth_token=self.credentials['api_key'],
            campaign_id=self.credentials['campaign_id']
        )
    
    async def fetch_orders(self, days_back: int = 1, **kwargs) -> List[Dict[str, Any]]:
        """Получение заказов за последние N дней"""
        since = datetime.datetime.now() - datetime.timedelta(days=days_back)
        async with self.api_client:
            return await self.api_client.get_orders(from_date=since)
    
    def normalize_order_data(self, raw_order: Dict[str, Any]) -> Dict[str, Any]:
        """Нормализация данных Яндекс.Маркета к единому формату"""
        try:
            total_amount = float(raw_order.get('buyerTotal', 0))
        except (TypeError, ValueError):
            total_amount = 0.0

        return {
            'external_id': str(raw_order.get('id')),
            'number': raw_order.get('externalOrderId', ''),
            'posting_number': '',
            'status': self.map_status(raw_order.get('status')),
            'created_at_marketplace': self.parse_ya_date(raw_order.get('creationDate')),
            'total_amount': total_amount,
            'items': self.normalize_items(raw_order.get('items', [])),
        }
    
    def parse_ya_date(self, date_str: str) -> datetime.datetime:
        """Парсинг даты из Яндекс формата: 'ДД-ММ-ГГГГ ЧЧ:ММ:СС'"""
        if not date_str:
            return None
        
        try:
            dt = datetime.datetime.strptime(date_str, "%d-%m-%Y %H:%M:%S")
            from django.utils import timezone
            import pytz
            msk = pytz.timezone('Europe/Moscow')
            dt = msk.localize(dt)
            return dt.astimezone(pytz.utc)
        except (ValueError, AttributeError) as e:
            logger.warning(f"Не удалось распарсить дату Яндекса: {date_str} | Ошибка: {e}")
            return None
    
    def map_status(self, ya_status: str) -> str:
        """Маппинг статусов Яндекс.Маркета на внутренние"""
        status_map = {
            'PLACING': 'new',
            'PROCESSING': 'processing',
            'DELIVERY': 'shipped',
            'PICKUP': 'shipped',
            'DELIVERED': 'delivered',
            'CANCELLED': 'cancelled',
            'UNPAID': 'new',
        }
        return status_map.get(ya_status, 'new')
    
    def normalize_items(self, raw_items: List[Dict]) -> List[Dict]:
        """Нормализация товаров"""
        normalized = []
        for item in raw_items:
            try:
                normalized_item = {
                    'product_id': item.get('id'),                # Внешний ID
                    'offer_id': item.get('shopSku'),             # Твой артикул (ключевое!)
                    'quantity': item.get('count', 1),
                    'price': float(item.get('buyerPrice', 0)),   # Цена для покупателя
                }
                normalized.append(normalized_item)
            except Exception as e:
                logger.error(f"Ошибка нормализации товара Яндекса: {str(e)}")
                continue
        return normalized