from .base import BaseAPIClient
from typing import Dict, Any, List
import datetime

class OzonAPIClient(BaseAPIClient):
    """Клиент для работы с API Ozon"""

    def __init__(self, client_id: str, api_key: str):
        super().__init__(api_key, "https://api-seller.ozon.ru")
        self.client_id = client_id
        print(api_key)
    
    async def get_headers(self) -> Dict[str, str]:
        return {
            "Client-Id": self.client_id,
            "Api-Key": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def get_orders(self, since: datetime.datetime, to: datetime.datetime = None) -> List[Dict[str, Any]]:
        if to is None:
            to = datetime.datetime.now()
        
        payload = {
            "filter": {
                "since": since.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "to": to.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            },
            "limit": 1000
        }

        print(payload)

        response = await self.make_request("POST", "/v3/posting/fbs/list", json=payload)
        return response.get("result", {}).get("postings", [])