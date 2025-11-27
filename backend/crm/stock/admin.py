from django.contrib import admin
from .models import ProductStock

@admin.register(ProductStock)
class ProductStockAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'available_quantity', 'reserved_wb', 
        'reserved_ozon', 'reserved_yandex', 'get_actual_available', 
        'is_low_stock', 'updated_at'
    ]
    list_filter = ['updated_at', 'product__category']
    search_fields = ['product__article', 'product__name']
    readonly_fields = ['get_total_reserved', 'get_actual_available', 'updated_at', 'created_at']
    
    def get_actual_available(self, obj):
        return obj.get_actual_available()
    get_actual_available.short_description = 'Фактически доступно'
    
    def is_low_stock(self, obj):
        return obj.is_low_stock()
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Низкий остаток'