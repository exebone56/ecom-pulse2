# warehouse/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Warehouse(models.Model):
    WAREHOUSE_TYPES = (
        ('main', 'Основной'),
        ('reserve', 'Резервный'),
        ('retail', 'Розничный'),
        ('wholesale', 'Оптовый'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Активный'),
        ('inactive', 'Неактивный'),
        ('maintenance', 'На обслуживании'),
    )

    name = models.CharField(max_length=255, verbose_name='Название склада')
    type = models.CharField(max_length=20, choices=WAREHOUSE_TYPES, default='main', verbose_name='Тип склада')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Статус')
    
    # Контактная информация
    address = models.TextField(verbose_name='Адрес')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Телефон')
    email = models.EmailField(blank=True, verbose_name='Email')
    
    # Ответственные лица
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='managed_warehouses', verbose_name='Менеджер склада')
    
    # Дополнительная информация
    capacity = models.PositiveIntegerField(null=True, blank=True, verbose_name='Вместимость (м³)')
    description = models.TextField(blank=True, verbose_name='Описание')
    
    # Системные поля
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, 
                                 related_name='created_warehouses', verbose_name='Создатель')
    
    class Meta:
        verbose_name = 'Склад'
        verbose_name_plural = 'Склады'
        ordering = ['name']
        indexes = [
            models.Index(fields=['type', 'status']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def current_capacity_usage(self):
        """Текущая загрузка склада"""
        return 0
    
    @property
    def active_products_count(self):
        """Количество активных товаров на складе"""
        try:
            from stock.models import ProductStock
            return self.stocks.filter(product__is_active=True).count()
        except Exception:
            return 0