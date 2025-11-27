import asyncio
import logging
from datetime import datetime
import schedule
import time
from .manager import ParserManager

logger = logging.getLogger(__name__)

class ParserScheduler:
    """Планировщик для регулярного запуска парсеров"""
    
    def __init__(self, interval_minutes: int = 30):
        self.interval = interval_minutes
        self.manager = ParserManager()
        self.is_running = False
    
    async def run_parsing_job(self):
        """Задача для парсинга"""
        logger.info(f"Starting parsing job at {datetime.now()}")
        
        try:
            results = await self.manager.run_all_parsers()
            total_processed = sum(
                result['processed'] for result in results.values() 
                if result.get('success')
            )
            
            logger.info(f"Parsing job completed. Processed {total_processed} orders total")
            return results
            
        except Exception as e:
            logger.error(f"Parsing job failed: {str(e)}")
            return {}
    
    def start_scheduler(self):
        """Запуск планировщика"""
        self.is_running = True
        
        schedule.every(self.interval).minutes.do(
            lambda: asyncio.create_task(self.run_parsing_job())
        )
        
        logger.info(f"Scheduler started with {self.interval} minutes interval")
        
        while self.is_running:
            schedule.run_pending()
            time.sleep(1)
    
    def stop_scheduler(self):
        """Остановка планировщика"""
        self.is_running = False
        logger.info("Scheduler stopped")

scheduler = ParserScheduler(interval_minutes=30)