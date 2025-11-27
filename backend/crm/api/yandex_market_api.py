# api/yandex_client.py

from .base import BaseAPIClient
from typing import Dict, Any, List
import datetime
import logging

logger = logging.getLogger(__name__)

class YandexMarketAPIClient(BaseAPIClient):
    """Клиент для работы с API Яндекс.Маркета (v2)"""
    
    def __init__(self, oauth_token: str, campaign_id: str):
        super().__init__(oauth_token, "https://api.partner.market.yandex.ru")
        self.campaign_id = campaign_id
    
    async def get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def get_orders(self, from_date: datetime.datetime = None) -> List[Dict[str, Any]]:
        """Получение списка заказов (GET с query-параметрами)"""
        if from_date is None:
            from_date = datetime.datetime.now() - datetime.timedelta(days=2)
        
        from_date_str = from_date.strftime("%d-%m-%Y")
        
        params = {
            "fromDate": from_date_str,
            "limit": 1000,
        }
        
        endpoint = f"/v2/campaigns/{self.campaign_id}/orders"
        
        try:
            response = await self.make_request("GET", endpoint, params=params)
            return response.get("orders", [])
        except Exception as e:
            logger.error(f"Ошибка получения заказов Яндекс.Маркета: {str(e)}")
            return []