# documents/models.py
from django.db import models
from django.contrib.auth import get_user_model
from product.models import Product
from warehouse.models import Warehouse

User = get_user_model()

class Document(models.Model):
    DOCUMENT_TYPES = (
        ('incoming', 'Поступление'),
        ('outgoing', 'Списание'), 
        ('inventory', 'Инвентаризация'),
        ('return', 'Возврат'),
        ('transfer', 'Перемещение'),
    )
    
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('pending', 'На согласовании'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    )
    
    CURRENCY_CHOICES = (
        ('RUB', 'Рубль'),
        ('USD', 'Доллар'),
        ('EUR', 'Евро'),
        ('CNY', 'Юань'),
    )

    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, verbose_name='Тип документа')
    document_number = models.CharField(max_length=50, unique=True, verbose_name='Номер документа')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Статус')
    
    partner = models.CharField(max_length=255, blank=True, verbose_name='Партнер')
    source_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, 
                                       related_name='source_documents', null=True, blank=True,
                                       verbose_name='Склад-источник')
    destination_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT,
                                            related_name='destination_documents', null=True, blank=True,
                                            verbose_name='Склад-назначение')
    
    total_products = models.PositiveIntegerField(default=0, verbose_name='Всего товаров')
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Общая стоимость')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='RUB', verbose_name='Валюта')
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_documents',
                                 verbose_name='Создатель')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата завершения')
    
    notes = models.TextField(blank=True, verbose_name='Примечания')
    is_deleted = models.BooleanField(default=False, verbose_name='Удален')
    
    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['document_type', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['document_number']),
        ]
    
    def __str__(self):
        return f"{self.document_number} - {self.get_document_type_display()} - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.document_number:
            prefix = {
                'incoming': 'IN',
                'outgoing': 'OUT', 
                'inventory': 'INV',
                'return': 'RET',
                'transfer': 'TRF'
            }.get(self.document_type, 'DOC')
            
            last_doc = Document.objects.filter(
                document_number__startswith=prefix
            ).order_by('-id').first()
            
            next_num = 1
            if last_doc and last_doc.document_number:
                try:
                    last_num = int(last_doc.document_number.replace(prefix, ''))
                    next_num = last_num + 1
                except ValueError:
                    pass
            
            self.document_number = f"{prefix}{next_num:06d}"
        
        if self.status == 'completed' and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        elif self.status != 'completed':
            self.completed_at = None
            
        super().save(*args, **kwargs)
    
    def update_totals(self):
        """Обновление итоговых значений на основе позиций"""
        items = self.items.all()
        self.total_products = sum(item.quantity for item in items)
        self.total_cost = sum(item.total_cost for item in items)
        self.save(update_fields=['total_products', 'total_cost'])
    
    def can_edit(self):
        """Можно ли редактировать документ"""
        return self.status in ['draft', 'pending']
    
    def can_delete(self):
        """Можно ли удалить документ"""
        return self.status in ['draft']


class DocumentItem(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='items',
                               verbose_name='Документ')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, verbose_name='Товар')
    
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Цена за единицу')
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Общая стоимость')
    
    batch_number = models.CharField(max_length=100, blank=True, verbose_name='Номер партии')
    expiration_date = models.DateField(null=True, blank=True, verbose_name='Срок годности')
    notes = models.TextField(blank=True, verbose_name='Примечания к позиции')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Позиция документа'
        verbose_name_plural = 'Позиции документов'
        unique_together = ['document', 'product']
    
    def __str__(self):
        return f"{self.document.document_number} - {self.product.article} - {self.quantity}"
    
    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.price
        super().save(*args, **kwargs)
        
        if self.document_id:
            self.document.update_totals()


class DocumentHistory(models.Model):
    """История изменений документов"""
    ACTION_CHOICES = (
        ('created', 'Создан'),
        ('updated', 'Обновлен'),
        ('status_changed', 'Изменен статус'),
        ('item_added', 'Добавлена позиция'),
        ('item_updated', 'Обновлена позиция'), 
        ('item_deleted', 'Удалена позиция'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    )
    
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='Пользователь')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='Действие')
    description = models.TextField(blank=True, verbose_name='Описание')
    changes = models.JSONField(default=dict, verbose_name='Изменения')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата действия')
    
    class Meta:
        verbose_name = 'История документа'
        verbose_name_plural = 'История документов'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.document.document_number} - {self.get_action_display()} - {self.user}"