from django.db import models

class Order(models.Model):
    class Meta:
        app_label = 'order'
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
        unique_together = [
            ["external_id", "marketplace"],
        ]
        indexes = [models.Index(fields=['status', 'created_at']),]
    
    class Status(models.TextChoices):
        NEW = 'new', 'Новый'
        PROCESSING = 'processing', 'В обработке'
        SHIPPED = 'shipped', 'Отправлен'
        DELIVERED = 'delivered', 'Доставлен'
        CANCELLED = 'cancelled', 'Отменен'

    external_id = models.CharField(max_length=255, verbose_name="Внешний ID заказа")
    number = models.CharField(max_length=150, verbose_name="Номер заказа")
    posting_number =models.CharField(max_length=150, verbose_name="Номер отправления")
    marketplace = models.ForeignKey("marketplace.Marketplace", on_delete=models.PROTECT, related_name="orders", verbose_name="Маркетплейс")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name="Статус"
    )
    order_type = models.CharField(
        max_length=10,
        choices=[('FBS', 'FBS'), ('FBO', 'FBO')],
        default='FBS',
        verbose_name="Тип заказа"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    created_at_marketplace =  models.DateTimeField(null=True, blank=True, verbose_name="Дата создания на маркетплейсе")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name="Общая сумма заказа"
    )

    def is_fbs(self):
        return self.order_type == 'FBS'

    def is_reserved_status(self):
        """Статусы, когда товар находится в резерве"""
        return self.status in [
            self.Status.NEW,
            self.Status.PROCESSING
        ]
    
    def is_shipped_status(self):
        """Статусы, когда товар отправлен (уже не в резерве)"""
        return self.status in [
            self.Status.SHIPPED,
            self.Status.DELIVERED
        ]

    def __str__(self):
        return f"Заказ: {self.number} создан {self.created_at} в системе ECOM-PULSE. МП: {self.marketplace}"
 
class OrderItem(models.Model):
    class Meta:
        app_label = 'order'
        verbose_name = "Позиция заказа"
        verbose_name_plural = "Позиции заказов"
        unique_together = [["order", "product"]]

    order= models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Заказ"
    )

    product = models.ForeignKey(
        'marketplace.MarketplaceProduct',
        on_delete=models.PROTECT,
        verbose_name="Товар"
    )

    quantity = models.PositiveIntegerField(
        default=1, 
       verbose_name="Количество"
    )
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Цена продажи",
        default=0,
        null=False,
        blank=False
    )
    