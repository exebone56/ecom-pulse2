# warehouse/serializers.py
from rest_framework import serializers
from .models import Warehouse
from stock.models import ProductStock
from users.serializers import UserSerializer

class WarehouseSerializer(serializers.ModelSerializer):
    manager_info = UserSerializer(source='manager', read_only=True)
    created_by_info = UserSerializer(source='created_by', read_only=True)
    current_capacity_usage = serializers.ReadOnlyField()
    active_products_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Warehouse
        fields = [
            'id', 'name', 'type', 'status', 'address', 'phone', 'email',
            'manager', 'manager_info', 'capacity', 'description',
            'is_active', 'created_at', 'updated_at', 'created_by', 'created_by_info',
            'current_capacity_usage', 'active_products_count'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class WarehouseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'name', 'type', 'status', 'address', 'phone', 'email',
            'manager', 'capacity', 'description'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)