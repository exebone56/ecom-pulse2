# parsers/wildberries_parser.py
from .base import BaseParser
from api.wb_api import WildberriesAPIClient, WBEnvironment
from api.wb_config import WBApiCategory
from typing import List, Dict, Any
import datetime
import logging
import datetime

logger = logging.getLogger(__name__)

class WildberriesParser(BaseParser):
    """Парсер для Wildberries с поддержкой всех API"""
    
    def __init__(self, marketplace_id=None, marketplace_code: str = 'wildberries'):
        super().__init__(marketplace_id=marketplace_id, marketplace_code=marketplace_code)
        
        environment = WBEnvironment.PRODUCTION
        if self.credentials.get('environment') == 'sandbox':
            environment = WBEnvironment.SANDBOX
            
        self.api_client = WildberriesAPIClient(
            api_key=self.credentials['api_key'],
            environment=environment
        )
    
    async def fetch_orders(self, days_back: int = 1, **kwargs) -> List[Dict[str, Any]]:
        """Получение заказов за последние N дней"""
        since = datetime.datetime.now() - datetime.timedelta(days=days_back)
        
        async with self.api_client:
            marketplace_client = self.api_client.get_client(WBApiCategory.STATISTICS)
            orders = await marketplace_client.get_orders(date_start=since)            
            return orders
    
    def normalize_order_data(self, raw_order: Dict[str, Any]) -> Dict[str, Any]:
        """Нормализация данных Wildberries к единому формату (1 заказ = 1 товар)"""
        return {
            'external_id': str(raw_order.get('srid', '')),
            'number': str(raw_order.get('gNumber', '')),
            'posting_number': raw_order.get('sticker', ''),
            'status': self.map_status(raw_order.get('status')),
            'created_at_marketplace': self.parse_wb_date(raw_order.get('date')),
            'total_amount': raw_order.get('priceWithDisc', 0),
            'items': [self.normalize_single_item(raw_order)],
        }
    
    def parse_wb_date(self, date_str: str) -> datetime.datetime:
        """Парсинг даты из WB формата (всегда UTC)"""
        if not date_str:
            return None
        
        try:
            if date_str.endswith('Z'):
                date_str = date_str[:-1] + '+00:00'
            
            dt = datetime.datetime.fromisoformat(date_str)
            
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            
            return dt
        except (ValueError, AttributeError) as e:
            logger.warning(f"Не удалось распарсить дату WB: {date_str} | Ошибка: {e}")
            return None
    
    def map_status(self, wb_status: str) -> str:
        """Маппинг статусов Wildberries на внутренние"""
        status_map = {
            'new': 'new',           # Новый
            'approve': 'processing', # Принят
            'confirm': 'processing', # Подтвержден
            'complete': 'delivered', # Выполнен
            'cancel': 'cancelled',   # Отменен
            'clientArbitrage': 'cancelled', # Спор с клиентом
            'delivering': 'shipped', # Доставляется
        }
        return status_map.get(wb_status, 'new')
    
    def normalize_single_item(self, raw_order: Dict[str, Any]) -> Dict[str, Any]:
        """Нормализация одного товара из корня заказа WB"""
        return {
            'product_id': raw_order.get('nmId'),
            'offer_id': raw_order.get('supplierArticle'),
            'quantity': raw_order.get('quantity', 1),
            'price': raw_order.get('priceWithDisc', 0),
        }
    
    async def fetch_sales_report(self, days_back: int = 30) -> List[Dict[str, Any]]:
        """Получение отчета о продажах"""
        since = datetime.datetime.now() - datetime.timedelta(days=days_back)
        
        async with self.api_client:
            analytics_client = self.api_client.get_client(WBApiCategory.ANALYTICS)
            return await analytics_client.get_sales_report(date_from=since)
    
    async def fetch_stocks_report(self) -> List[Dict[str, Any]]:
        """Получение отчета об остатках"""
        since = datetime.datetime.now() - datetime.timedelta(days=1)
        
        async with self.api_client:
            analytics_client = self.api_client.get_client(WBApiCategory.ANALYTICS)
            return await analytics_client.get_stocks_report(date_from=since)