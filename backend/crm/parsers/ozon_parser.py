from .base import BaseParser
from api.ozon_api import OzonAPIClient
from typing import List, Dict, Any
import datetime

class OzonParser(BaseParser):
    """Парсер для Ozon"""
    
    def __init__(self, marketplace_id=None, marketplace_code: str = 'ozon'):
        super().__init__(marketplace_id=marketplace_id, marketplace_code=marketplace_code)
        self.api_client = OzonAPIClient(
            client_id=self.credentials['client_id'],
            api_key=self.credentials['api_key']
        )
    
    async def fetch_orders(self, hours_back: int = 720) -> List[Dict[str, Any]]:
        """Получение заказов за последние N часов"""
        since = datetime.datetime.now() - datetime.timedelta(hours=hours_back)
        
        async with self.api_client:
            return await self.api_client.get_orders(since=since)
    
    def normalize_order_data(self, raw_order: Dict[str, Any]) -> Dict[str, Any]:
        """Нормализация данных Ozon к единому формату"""
        total = sum(float(p.get('price', 0)) * p.get('quantity', 1) for p in raw_order.get('products', []))
        return {
            'external_id': raw_order.get('order_id'),
            'number': raw_order.get('order_number'),
            'posting_number': raw_order.get('posting_number'),
            'status': self.map_status(raw_order.get('status')),
            'created_at_marketplace': raw_order.get('in_process_at'),
            'total_amount': total,
            'items': self.normalize_items(raw_order.get('products', []))
        }
    
    def map_status(self, ozon_status: str) -> str:
        """Маппинг статусов Ozon на внутренние"""
        status_map = {
            'awaiting_registration': 'new',
            'acceptance_in_progress': 'processing',
            'awaiting_approve': 'processing',
            'awaiting_packaging': 'processing',
            'awaiting_deliver': 'shipped',
            'delivering': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled'
        }
        return status_map.get(ozon_status, 'new')
    
    def normalize_items(self, raw_items: List[Dict]) -> List[Dict]:
        """Нормализация товаров"""
        return [{
            'product_id': item.get('sku'),
            'offer_id': item.get('offer_id'),
            'quantity': item.get('quantity', 1),
            'price': item.get('price', '0')
        } for item in raw_items]