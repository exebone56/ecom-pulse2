from django.db import models
from .fields import EncryptedTextField

class MarketplaceManager(models.Manager):
    """Кастомный менеджер для Marketplace"""
    
    def active(self):
        """Возвращает активные маркетплейсы"""
        return self.filter(status='active')
    
    def inactive(self):
        """Возвращает неактивные маркетплейсы"""
        return self.filter(status='inactive')

class Marketplace(models.Model):
    """Упрощенная модель Marketplace без шифрования"""
    
    class Environment(models.TextChoices):
        PRODUCTION = 'production', 'Production'
        SANDBOX = 'sandbox', 'Sandbox'
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Активный'
        INACTIVE = 'inactive', 'Неактивный'
        TESTING = 'testing', 'Тестирование'

    name = models.CharField(max_length=100, verbose_name="Название маркетплейса")
    code = models.CharField(
        max_length=50, 
        verbose_name="Код",
        choices=[
            ('ozon', 'Ozon'),
            ('wildberries', 'Wildberries'), 
            ('yandex_market', 'Yandex.Market')
        ]
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.ACTIVE,
        verbose_name="Статус"
    )
    environment = models.CharField(
        max_length=20, 
        choices=Environment.choices, 
        default=Environment.PRODUCTION, 
        verbose_name="Окружение"
    )
    
    api_key = EncryptedTextField(blank=True, verbose_name="API ключ")
    client_id = models.CharField(max_length=255, blank=True, verbose_name="Client ID")
    client_secret = EncryptedTextField(blank=True, verbose_name="Client Secret")
    campaign_id = models.CharField(max_length=255, blank=True, verbose_name="ID кампании")
    seller_id = models.CharField(max_length=255, blank=True, verbose_name="ID продавца")
    warehouse_id = models.CharField(max_length=255, blank=True, verbose_name="ID склада")
    
    extra_credentials = models.JSONField(
        default=dict, 
        blank=True, 
        verbose_name="Дополнительные учетные данные"
    )
    
    parsing_interval = models.PositiveIntegerField(
        default=30,
        verbose_name="Интервал парсинга (минуты)"
    )
    max_orders_per_request = models.PositiveIntegerField(
        default=1000,
        verbose_name="Максимум заказов за запрос"
    )
    days_to_look_back = models.PositiveIntegerField(
        default=7,
        verbose_name="Дней для поиска заказов назад"
    )
    
    is_webhook_enabled = models.BooleanField(
        default=False,
        verbose_name="Вебхуки включены"
    )
    webhook_url = models.URLField(blank=True, verbose_name="URL для вебхуков")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    last_successful_sync = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Последняя успешная синхронизация"
    )

    objects = MarketplaceManager()

    class Meta:
        verbose_name = "Маркетплейс"
        verbose_name_plural = "Маркетплейсы"
        db_table = 'marketplaces'

    def __str__(self):
        return f"{self.name} ({self.get_environment_display()})"

    def get_api_credentials(self) -> dict:
        """Возвращает все учетные данные в виде словаря"""
        credentials = {
            'api_key': self.api_key,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'campaign_id': self.campaign_id,
            'seller_id': self.seller_id,
            'warehouse_id': self.warehouse_id,
            'environment': self.environment,
            'code': self.code,
        }
        
        if self.extra_credentials:
            credentials.update(self.extra_credentials)
        
        return credentials

    @property
    def is_active(self) -> bool:
        """Свойство для обратной совместимости"""
        return self.status == self.Status.ACTIVE

class MarketplaceProduct(models.Model):
    """Связь продукта с маркетплейсом"""

    class Meta:
        verbose_name = 'Товар на маркетплейсе'
        verbose_name_plural = 'Товары на маркетплейсах'
        unique_together = ['product', 'marketplace']
        ordering = ['marketplace', 'product']

    product = models.ForeignKey(
        'product.Product',
        verbose_name='Продукт',
        on_delete=models.CASCADE,
        related_name='marketplace_products'
    )

    marketplace = models.ForeignKey(
        Marketplace,
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name="Маркетплейс"
    )

    barcode = models.CharField(
        max_length=70,
        blank=True,
        null=True,
        help_text="Штрихкод для маркетплейса"
    )

    external_sku = models.CharField(
        verbose_name='Внешний артикул',
        max_length=100,
        blank=True,
        null=True,
        help_text='Артикул на маркетплейсе'
    )
    
    external_product_id = models.CharField(
        verbose_name='ID товара на маркетплейсе',
        max_length=100,
        blank=True,
        null=True,
        help_text='Внутренний ID товара на маркетплейсе'
    )

    price = models.DecimalField(
        verbose_name="Цена товара на маркетплейсе",
        max_digits=10,
        decimal_places=2,
    )

    STATUS_CHOICES = [
        ('DRAFT', 'Черновик'),
        ('MODERATION', 'На модерации'),
        ('REJECTED', 'Отклонен'),
        ('ACTIVE', 'Активный'),
        ('INACTIVE', 'Неактивный'),
        ('ARCHIVED', 'В архиве'),
    ]
    
    status = models.CharField(
        verbose_name='Статус',
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    
    last_sync = models.DateTimeField(
        verbose_name='Последняя синхронизация',
        blank=True,
        null=True
    )
    
    sync_enabled = models.BooleanField(
        verbose_name='Синхронизация включена',
        default=True
    )
    
    created_at = models.DateTimeField(
        verbose_name='Дата создания',
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        verbose_name='Дата обновления',
        auto_now=True
    )

    def __str__(self):
        return f"{self.product.article} - {self.marketplace.name}"