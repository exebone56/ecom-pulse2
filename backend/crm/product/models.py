import os
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from category.models import Category

def product_main_image_path(instance, filename):
    """Путь для сохранения главного изображения продукта под ID"""
    # Если объект уже имеет ID, используем его
    if instance.pk:
        product_id = instance.pk
    else:
        # Временно используем 'temp', потом переименуем
        product_id = 'temp'
    
    name, ext = os.path.splitext(filename)
    safe_filename = slugify(name) + ext.lower()
    return f'products/{product_id}/main/{safe_filename}'

def product_additional_images_path(instance, filename):
    """Путь для сохранения дополнительных изображений под ID продукта"""
    if instance.product.pk:
        product_id = instance.product.pk
    else:
        product_id = 'temp'
    
    name, ext = os.path.splitext(filename)
    safe_filename = slugify(name) + ext.lower()
    return f'products/{product_id}/additional/{safe_filename}'

class Country(models.Model):
    """Модель для страны"""
    class Meta:
        verbose_name = "Страна"
        verbose_name_plural = "Страны"
        ordering = ['name']
    

    code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Код страны"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Название страны"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активна"
    )

    def __str__(self):
        return self.name


class ProductDirection(models.Model):
    """Модель для направлений продуктов"""
    class Meta:
        verbose_name = 'Направление продукта'
        verbose_name_plural = 'Направления продуктов'
        ordering = ['name']

    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Код направления"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Название направления"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно"
    )
    
    def __str__(self):
        return self.name


class Product(models.Model):

    class Meta:
        verbose_name = 'Продукт'
        verbose_name_plural = 'Продукты'
        ordering = ['-created_at']

    name = models.CharField(
        max_length=70,
        verbose_name="Имя товара",
    )

    category = models.ForeignKey(
        Category,
        verbose_name="Категория",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="products"
    )

    country = models.ForeignKey(
        Country,
        verbose_name='Страна производства',
        on_delete=models.PROTECT,
        related_name='products'
    )
    
    direction = models.ForeignKey(
        ProductDirection,
        verbose_name='Направление продукта',
        on_delete=models.PROTECT,
        related_name='products'
    )

    main_img = models.ImageField(
        verbose_name="Основное изображение",
        upload_to=product_main_image_path,
        blank=True,
        null=True
    )

    article = models.CharField(
        verbose_name="Артикул",
        max_length=100,
        unique=True,
        db_index=True
    )

    description = models.TextField(
        verbose_name="Описание",
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        verbose_name="Активный",
        default=True
    )

    packing_length = models.DecimalField(
        verbose_name="Длина упаковки (см)",
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )

    packing_width = models.DecimalField(
        verbose_name='Ширина упаковки (см)',
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )

    packing_height = models.DecimalField(
        verbose_name='Высота упаковки (см)',
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )

    packing_weight = models.DecimalField(
        verbose_name='Вес упаковки (кг)',
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )

    notes = models.JSONField(
        verbose_name='Примечания и FAQ',
        blank=True,
        null=True,
        help_text='Ответы на частые вопросы покупателей и т.д.'
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
        return f"{self.article}"
    
    def save(self, *args, **kwargs):
        if self.pk is None:
            image_file = self.main_img
            self.main_img = None
            super().save(*args, **kwargs)
            
            if image_file:
                self.main_img = image_file
                super().save(update_fields=['main_img'])
        else:
            super().save(*args, **kwargs)

    def get_packing_volume(self):
        """Возвращает объем упаковки в см³"""
        if all([self.packing_length, self.packing_width, self.packing_height]):
            return self.packing_length * self.packing_width * self.packing_height
        return None
    
    def has_complete_packing_info(self):
        """Проверяет, заполнены ли все габариты"""
        return all([
            self.packing_length,
            self.packing_width, 
            self.packing_height,
            self.packing_weight
        ])

    def get_country_display_name(self):
        """Возвращает читаемое название страны"""
        return self.country.name if self.country else 'Не указана'
    
    def get_direction_display_name(self):
        """Возвращает читаемое название направления"""
        return self.direction.name if self.direction else 'Не указано'
    
    def is_own_production(self):
        """Проверяет, является ли товар собственным производством"""
        return self.direction.code == 'OWN_PRODUCTION' if self.direction else False
    
    def is_resale(self):
        """Проверяет, является ли товар для перепродажи"""
        return self.direction.code == 'RESALE' if self.direction else False

class ProductImage(models.Model):
    """Модель для дополнительных изображений товара"""
    
    product = models.ForeignKey(
        Product,
        verbose_name='Продукт',
        on_delete=models.CASCADE,
        related_name='additional_images'
    )
    
    image = models.ImageField(
        verbose_name='Изображение',
        upload_to=product_additional_images_path
    )
    
    alt_text = models.CharField(
        verbose_name='Альтернативный текст',
        max_length=200,
        blank=True,
        null=True,
        help_text='Описание изображения для SEO'
    )
    
    order = models.PositiveIntegerField(
        verbose_name='Порядок',
        default=0,
        help_text='Порядок отображения (меньше - выше)'
    )
    
    created_at = models.DateTimeField(
        verbose_name='Дата добавления',
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Дополнительное изображение'
        verbose_name_plural = 'Дополнительные изображения'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Изображение для {self.product.article}"
    
    def save(self, *args, **kwargs):
        if self.pk is None:
            image_file = self.image
            self.image = None
            super().save(*args, **kwargs)
            
            if image_file:
                self.image = image_file
                super().save(update_fields=['image'])
        else:
            super().save(*args, **kwargs)
    


