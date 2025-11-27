from django.db.models.signals import post_save
from django.dispatch import receiver
from product.models import Product
from marketplace.services import MarketplaceStockService
from .models import ProductStock

@receiver(post_save, sender=Product)
def create_product_stock(sender, instance, created, **kwargs):
    """Автоматически создает запись об остатках при создании товара"""
    if created:
        ProductStock.objects.create(product=instance)

@receiver(post_save, sender=ProductStock)
def sync_stock_to_marketplaces(sender, instance, **kwargs):
    """Автоматическая синхронизация остатков с маркетплейсами при изменении"""
    if not kwargs.get('created', False): 
        MarketplaceStockService.sync_stock_to_marketplaces(instance)