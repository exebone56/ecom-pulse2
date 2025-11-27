from rest_framework import serializers
from .models import Marketplace, MarketplaceProduct

class MarketplaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marketplace
        fields = ['id', 'name', 'is_active']

class MarketplaceProductSerializer(serializers.ModelSerializer):
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)
    marketplace_id = serializers.IntegerField(source='marketplace.id', read_only=True)

    class Meta:
        model = MarketplaceProduct
        fields = [
            'id', 'marketplace', 'marketplace_id', 'marketplace_name', 'barcode', 
            'external_sku', 'external_product_id', 'status',
            'last_sync', 'sync_enabled', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'marketplace': {'read_only': True},
            'product': {'read_only': True},
        }
    
    def validate_status(self, value):
        """Валидация статуса"""
        valid_statuses = [choice[0] for choice in MarketplaceProduct.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Статус должен быть одним из: {', '.join(valid_statuses)}")
        return value
    
    def create(self, validated_data):
        """Создание с автоматическим заполнением product и marketplace"""
        validated_data['product'] = self.context['product']
        validated_data['marketplace'] = self.context['marketplace']
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Обновление с автоматическим заполнением product и marketplace"""
        validated_data.pop('product', None)
        validated_data.pop('marketplace', None)
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['marketplace'] = instance.marketplace.id
        return data