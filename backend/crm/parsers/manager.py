import asyncio
import logging
from typing import Dict, Any, Optional
from asgiref.sync import sync_to_async
from marketplace.models import Marketplace
from .ozon_parser import OzonParser
from .wb_parser import WildberriesParser
from .yandex_parser import YandexParser

logger = logging.getLogger(__name__)

class ParserManager:
    """Менеджер для управления парсерами"""
    
    def __init__(self):
        self._parsers: Dict[str, Any] = {}
    
    async def _create_parser(self, mp: Marketplace) -> Optional[Any]:
        """Создание парсера"""
        try:
            if mp.code == 'ozon':
                parser = await sync_to_async(OzonParser)(marketplace_id=mp.id)
            elif mp.code == 'wildberries':
                parser = await sync_to_async(WildberriesParser)(marketplace_id=mp.id)
            elif mp.code == 'yandex_market':
                parser = await sync_to_async(YandexParser)(marketplace_id=mp.id)
            else:
                logger.error(f"Unknown marketplace code: {mp.code}")
                return None
            return parser
        except Exception as e:
            logger.error(f"Error creating parser for {mp.name}: {str(e)}")
            return None

    async def get_parser(self, marketplace_id: str) -> Optional[Any]:
        """Получение парсера по ID маркетплейса"""
        if marketplace_id in self._parsers:
            return self._parsers[marketplace_id]
        
        try:
            mp = await sync_to_async(
                lambda: Marketplace.objects.get(id=marketplace_id, status=Marketplace.Status.ACTIVE)
            )()
            
            parser = await self._create_parser(mp)
            if parser:
                self._parsers[marketplace_id] = parser
            return parser
            
        except Exception as e:
            logger.error(f"Error loading parser for ID {marketplace_id}: {str(e)}")
            return None

    async def run_all_parsers(self) -> dict:
        """Запуск всех активных парсеров"""
        results = {}
        
        marketplaces = await sync_to_async(
            lambda: list(Marketplace.objects.filter(status=Marketplace.Status.ACTIVE))
        )()
        
        for mp in marketplaces:
            parser = await self.get_parser(str(mp.id))
            if parser is None:
                continue
                
            try:
                processed = await parser.parse_orders()
                results[str(mp.id)] = {
                    'success': True,
                    'processed': processed,
                    'name': mp.name,
                    'code': mp.code
                }
                logger.info(f"Parser {mp.name} processed {processed} orders")
            except Exception as e:
                logger.error(f"Parser {mp.name} error: {str(e)}")
                results[str(mp.id)] = {
                    'success': False,
                    'error': str(e),
                    'name': mp.name,
                    'code': mp.code
                }
                
        return results

    async def run_parsers_concurrently(self) -> dict:
        """Параллельный запуск всех парсеров"""
        marketplaces = await sync_to_async(
            lambda: list(Marketplace.objects.filter(status=Marketplace.Status.ACTIVE))
        )()
        
        tasks = [self._run_single_parser_async(str(mp.id)) for mp in marketplaces]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        results = {}
        for mp, result in zip(marketplaces, results_list):
            if isinstance(result, Exception):
                results[str(mp.id)] = {
                    'success': False,
                    'error': str(result),
                    'name': mp.name,
                    'code': mp.code
                }
            else:
                results[str(mp.id)] = result
                
        return results

    async def _run_single_parser_async(self, marketplace_id: str) -> dict:
        """Запуск одного парсера"""
        parser = await self.get_parser(marketplace_id)
        if parser is None:
            return {
                'success': False,
                'error': 'Parser not found',
                'processed': 0
            }
        
        try:
            processed = await parser.parse_orders()
            return {
                'success': True,
                'processed': processed
            }
        except Exception as e:
            logger.error(f"Parser {marketplace_id} error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'processed': 0
            }