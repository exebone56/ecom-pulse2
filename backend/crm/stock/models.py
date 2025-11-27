from django.db import models
from product.models import Product

class ProductStock(models.Model):
    """Модель для остатков товаров"""
    
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name='stock',
        verbose_name='Товар',
        unique=True
    )
    
    available_quantity = models.PositiveIntegerField(
        verbose_name='Доступный остаток',
        default=0
    )
    
    reserved_wb = models.PositiveIntegerField(
        verbose_name='В резерве WB',
        default=0
    )
    
    reserved_ozon = models.PositiveIntegerField(
        verbose_name='В резерве OZON', 
        default=0
    )
    
    reserved_yandex = models.PositiveIntegerField(
        verbose_name='В резерве Яндекс.Маркет',
        default=0
    )
    
    updated_at = models.DateTimeField(
        verbose_name='Дата обновления',
        auto_now=True
    )
    
    created_at = models.DateTimeField(
        verbose_name='Дата создания',
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Остаток товара'
        verbose_name_plural = 'Остатки товаров'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Остатки {self.product.article}"
    
    def get_total_reserved(self):
        """Общее количество в резерве"""
        return self.reserved_wb + self.reserved_ozon + self.reserved_yandex
    
    def get_actual_available(self):
        """Фактически доступный остаток (доступный - резерв)"""
        return max(0, self.available_quantity - self.get_total_reserved())
    
    def is_low_stock(self, threshold=10):
        """Проверка на низкий остаток"""
        return self.get_actual_available() <= threshold