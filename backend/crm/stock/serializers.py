from rest_framework import serializers
from .models import ProductStock
from product.serializers import ProductListSerializer

class ProductStockSerializer(serializers.ModelSerializer):
    """Сериализатор для остатков товара"""
    product_info = ProductListSerializer(source='product', read_only=True)
    total_reserved = serializers.ReadOnlyField()
    actual_available = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductStock
        fields = [
            'id', 'product', 'product_info',
            'available_quantity', 'reserved_wb', 'reserved_ozon', 'reserved_yandex',
            'total_reserved', 'actual_available', 'is_low_stock',
            'updated_at', 'created_at'
        ]
        read_only_fields = ['product', 'updated_at', 'created_at']

class BulkStockUpdateSerializer(serializers.Serializer):
    """Сериализатор для массового обновления остатков через файл"""
    file = serializers.FileField()
    
    def validate_file(self, value):
        """Валидация файла"""
        if not value.name.endswith(('.csv', '.xlsx', '.xls')):
            raise serializers.ValidationError("Поддерживаются только CSV и Excel файлы")
        return value

class StockUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления остатков конкретного товара"""
    class Meta:
        model = ProductStock
        fields = [
            'available_quantity', 'reserved_wb', 'reserved_ozon', 'reserved_yandex'
        ]