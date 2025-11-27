import abc
import aiohttp
import asyncio
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseAPIClient(abc.ABC):
    """Базовый клиент для работы с API маркетплейсов"""

    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    @abc.abstractmethod
    async def get_headers(self) -> Dict[str, str]:
        """Возвращает заголовки для запроса"""
        pass

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Универсальный метод для выполнения запросов"""
        try:
            url = f"{self.base_url}{endpoint}"
            headers = await self.get_headers()

            async with self.session.request(
                method=method,
                url=url,
                headers=headers,
                **kwargs
            ) as response:
                response.raise_for_status()
                return await response.json()
        
        except Exception as e:
            logger.error(f"API request error: {str(e)}")
            raise