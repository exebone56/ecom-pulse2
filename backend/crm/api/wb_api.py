from .base import BaseAPIClient
from .wb_config import WB_API_CONFIG, WBApiCategory, WBEnvironment
from typing import Dict, Any, List, Optional
import datetime
import logging

logger = logging.getLogger(__name__)

class WildberriesAPIClient:
    """Универсальный клиент для работы со всеми API Wildberries"""
    
    def __init__(self, api_key: str, environment: WBEnvironment = WBEnvironment.PRODUCTION):
        self.api_key = api_key
        self.environment = environment
        self.clients: Dict[WBApiCategory, BaseAPIClient] = {}
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Инициализация клиентов для каждой категории API"""
        for category, config in WB_API_CONFIG.items():
            base_url = self._get_base_url(category, config)
            if base_url:
                self.clients[category] = WildberriesCategoryClient(
                    api_key=self.api_key,
                    base_url=base_url.rstrip('/'),
                    category=category
                )
    
    def _get_base_url(self, category: WBApiCategory, config) -> Optional[str]:
        """Получение базового URL для категории"""
        if self.environment == WBEnvironment.PRODUCTION:
            return config.production
        elif self.environment == WBEnvironment.SANDBOX and config.sandbox:
            return config.sandbox
        return config.production  # fallback to production
    
    def get_client(self, category: WBApiCategory) -> 'WildberriesCategoryClient':
        """Получение клиента для конкретной категории"""
        if category not in self.clients:
            raise ValueError(f"Client for category {category} not initialized")
        return self.clients[category]
    
    async def __aenter__(self):
        """Контекстный менеджер для всех клиентов"""
        for client in self.clients.values():
            await client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Выход из контекстного менеджера для всех клиентов"""
        for client in self.clients.values():
            await client.__aexit__(exc_type, exc_val, exc_tb)

class WildberriesCategoryClient(BaseAPIClient):
    """Клиент для конкретной категории API Wildberries"""
    
    def __init__(self, api_key: str, base_url: str, category: WBApiCategory):
        super().__init__(api_key, base_url)
        self.category = category
    
    async def get_headers(self) -> Dict[str, str]:
        """Заголовки для Wildberries API"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def get_orders(self, date_start: datetime.datetime = None, 
                        status: int = None, take: int = 1000, 
                        skip: int = 0) -> List[Dict[str, Any]]:
        """Получение списка заказов через Marketplace API"""
        if date_start is None:
            date_start = datetime.datetime.now() - datetime.timedelta(days=7)
        
        payload = {
            "flag": 1,
            "dateFrom": date_start.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        
        payload = {k: v for k, v in payload.items() if v is not None}
        
        try:
            response = await self.make_request("GET", "/api/v1/supplier/orders", params=payload)
            return response
        except Exception as e:
            logger.error(f"Error fetching orders from WB: {str(e)}")
            return []
    
    async def get_order_details(self, order_id: int) -> Dict[str, Any]:
        """Получение деталей конкретного заказа"""
        try:
            response = await self.make_request("GET", f"/api/v3/orders/{order_id}")
            return response
        except Exception as e:
            logger.error(f"Error fetching order {order_id} details: {str(e)}")
            return {}
        
    async def get_sales_report(self, date_from: datetime.datetime, 
                             date_to: datetime.datetime = None) -> List[Dict[str, Any]]:
        """Получение отчета о продажах через Analytics API"""
        if date_to is None:
            date_to = datetime.datetime.now()
        
        params = {
            "dateFrom": date_from.strftime("%Y-%m-%d"),
            "dateTo": date_to.strftime("%Y-%m-%d")
        }
        
        analytics_client = self.get_client(WBApiCategory.ANALYTICS)
        response = await analytics_client.make_request("GET", "/api/v1/sales", params=params)
        return response
    
    async def get_stocks_report(self, date_from: datetime.datetime) -> List[Dict[str, Any]]:
        """Получение отчета об остатках"""
        params = {
            "dateFrom": date_from.strftime("%Y-%m-%d")
        }
        
        analytics_client = self.get_client(WBApiCategory.ANALYTICS)
        response = await analytics_client.make_request("GET", "/api/v1/stocks", params=params)
        return response
    
    async def update_prices(self, prices_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Обновление цен товаров"""
        prices_client = self.get_client(WBApiCategory.PRICES)
        response = await prices_client.make_request("POST", "/public/api/v1/prices", 
                                                  json=prices_data)
        return response

    async def get_daily_stats(self, date_from: datetime.datetime) -> Dict[str, Any]:
        """Получение дневной статистики"""
        params = {
            "dateFrom": date_from.strftime("%Y-%m-%d")
        }
        
        statistics_client = self.get_client(WBApiCategory.STATISTICS)
        response = await statistics_client.make_request("GET", "/api/v1/supplier/sales", 
                                                      params=params)
        return response

    def get_client(self, category: WBApiCategory) -> 'WildberriesCategoryClient':
        """Вспомогательный метод для получения клиента другой категории"""
        return self