# order/serializers.py

from rest_framework import serializers
from .models import Order, OrderItem
from marketplace.models import Marketplace

class OrderItemSerializer(serializers.ModelSerializer):
    article = serializers.CharField(source='product.product.article')
    name = serializers.CharField(source='product.product.name')
    img = serializers.ImageField(source="product.product.main_img")
    class Meta:
        model = OrderItem
        fields = ['id', 'article', 'name', 'quantity', 'price', 'img']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_date = serializers.DateTimeField(source='created_at_marketplace')

    orderNumber = serializers.CharField(source='number')
    departureNumber = serializers.CharField(source='posting_number')
    orderCost = serializers.DecimalField(source='total_amount', max_digits=12, decimal_places=2)
    orderStatus = serializers.CharField(source='status')
    marketplace = serializers.CharField(source='marketplace.name')
    
    class Meta:
        model = Order
        fields = [
            'id', 'orderNumber', 'departureNumber', 'orderCost', 'orderStatus',
            'marketplace', 'order_date', 'items'
        ]