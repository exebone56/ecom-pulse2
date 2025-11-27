# admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductImage, Country, ProductDirection

admin.site.site_header = "Панель управления Ecom-Pulse"
admin.site.site_title = "Админ-панель Ecom-Pulse"
admin.site.index_title = "Управление данными"

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'products_count',]
    list_filter = ['is_active',]
    search_fields = ['name', 'code']
    list_editable = ['is_active',]
    actions = ['activate_countries', 'deactivate_countries']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'is_active')
        }),
    )

    def products_count(self, obj):
        return obj.products.count()
    products_count.short_description = 'Количество товаров'
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('products')
    
    @admin.action(description='Активировать выбранные страны')
    def activate_countries(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} стран активировано')
    
    @admin.action(description='Деактивировать выбранные страны')
    def deactivate_countries(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} стран деактивировано')

@admin.register(ProductDirection)
class ProductDirectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'products_count', 'has_description']
    list_filter = ['is_active',]
    search_fields = ['name', 'code', 'description']
    list_editable = ['is_active']
    actions = ['activate_directions', 'deactivate_directions']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'description', 'is_active')
        }),
    )

    def products_count(self, obj):
        return obj.products.count()
    products_count.short_description = 'Количество товаров'
    
    def has_description(self, obj):
        return bool(obj.description)
    has_description.short_description = 'Есть описание'
    has_description.boolean = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('products')
    
    @admin.action(description='Активировать выбранные направления')
    def activate_directions(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} направлений активировано')
    
    @admin.action(description='Деактивировать выбранные направления')
    def deactivate_directions(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} направлений деактивировано')

class ProductImageInline(admin.TabularInline):
    """Inline для дополнительных изображений"""
    model = ProductImage
    extra = 1
    max_num = 10

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active']
    list_filter = ['is_active', 'parent']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'article', 
        'category',
        'get_country_display',
        'get_direction_display',
        'is_active', 
        'packing_weight',
        'created_at'
    ]
    
    list_filter = [
        'is_active', 
        'category', 
        'country',
        'direction',
        'created_at'
    ]
    
    search_fields = ['article', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'category',
                'country',
                'direction',
                'main_img', 
                'article', 
                'description', 
                'is_active'
            )
        }),
        ('Габариты упаковки', {
            'fields': (
                'packing_length',
                'packing_width', 
                'packing_height',
                'packing_weight'
            )
        }),
        ('Дополнительно', {
            'fields': (
                'notes',
                'created_at',
                'updated_at'
            )
        }),
    )
    
    def get_country_display(self, obj):
        return obj.get_country_display_name()
    get_country_display.short_description = 'Страна'
    
    def get_direction_display(self, obj):
        return obj.get_direction_display_name()
    get_direction_display.short_description = 'Направление'

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['product__article']