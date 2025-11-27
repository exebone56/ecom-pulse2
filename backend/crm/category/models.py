from django.db import models
from django.core.validators import MinValueValidator

class Category(models.Model):
    """Модель категории товаров"""
    name = models.CharField(
        verbose_name='Название категории',
        max_length=100,
        db_index=True
    )
    
    parent = models.ForeignKey(
        'self',
        verbose_name='Родительская категория',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='children'
    )
    
    is_active = models.BooleanField(
        verbose_name='Активная',
        default=True
    )
    
    created_at = models.DateTimeField(
        verbose_name='Дата создания',
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name