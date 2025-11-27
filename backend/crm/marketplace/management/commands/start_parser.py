from django.core.management.base import BaseCommand
from parsers.manager import ParserManager
from asgiref.sync import async_to_sync

class Command(BaseCommand):
    help = 'Run marketplace parsers to fetch orders'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--marketplace-id',
            type=str,
            help='Marketplace ID'
        )
        parser.add_argument(
            '--concurrent',
            action='store_true',
            help='Run parsers concurrently'
        )

    def handle(self, *args, **options):
        marketplace_id = options.get('marketplace_id')
        concurrent = options.get('concurrent', False)
        manager = ParserManager()
        
        if marketplace_id:
            parser = async_to_sync(manager.get_parser)(marketplace_id)
            if parser:
                processed = async_to_sync(parser.parse_orders)()
                self.stdout.write(self.style.SUCCESS(f"Processed {processed} orders"))
            else:
                self.stdout.write(self.style.ERROR("Parser not found"))
        else:
            if concurrent:
                results = async_to_sync(manager.run_parsers_concurrently)()
            else:
                results = async_to_sync(manager.run_all_parsers)()
            
            success_count = sum(1 for r in results.values() if r.get('success'))
            total_processed = sum(r.get('processed', 0) for r in results.values() if r.get('success'))
            
            self.stdout.write(self.style.SUCCESS(
                f"Completed: {success_count}/{len(results)} parsers, "
                f"processed {total_processed} orders"
            ))