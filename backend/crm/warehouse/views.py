from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Sum, Count 

from .models import Warehouse
from .serializers import WarehouseSerializer, WarehouseCreateSerializer
from stock.models import ProductStock
from stock.serializers import ProductStockSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True).select_related(
        'manager', 'created_by'
    )
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'status', 'is_active']
    search_fields = ['name', 'address', 'description']
    ordering_fields = ['name', 'created_at', 'capacity']
    ordering = ['name']
    
    # Временно для тестирования - потом замените на ваши permissions
    permission_classes = [AllowAny]
    # permission_classes = [IsAuthenticated]
    # permission_classes = [IsWarehouseManager | IsManager]  # Ваши кастомные permissions
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WarehouseCreateSerializer
        return WarehouseSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """Получить остатки товаров на складе"""
        warehouse = self.get_object()
        
        product_id = request.query_params.get('product_id')
        low_stock = request.query_params.get('low_stock')
        
        queryset = ProductStock.objects.filter(warehouse=warehouse).select_related('product')
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        if low_stock == 'true':
            queryset = [stock for stock in queryset if stock.is_low_stock()]
        
        serializer = ProductStockSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Статистика по складу"""
        warehouse = self.get_object()
        
        stats = ProductStock.objects.filter(warehouse=warehouse).aggregate(
            total_products=Count('id'),
            total_quantity=Sum('available_quantity'),
            low_stock_count=Count('id', filter=Q(available_quantity__lte=10))
        )
        
        return Response({
            'warehouse': warehouse.name,
            'total_products': stats['total_products'] or 0,
            'total_quantity': stats['total_quantity'] or 0,
            'low_stock_count': stats['low_stock_count'] or 0,
            'capacity_usage': warehouse.current_capacity_usage,
        })
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Получить доступные типы складов"""
        return Response({
            'types': dict(Warehouse.WAREHOUSE_TYPES)
        })
    
    @action(detail=False, methods=['get'])  
    def statuses(self, request):
        """Получить доступные статусы складов"""
        return Response({
            'statuses': dict(Warehouse.STATUS_CHOICES)
        })

class WarehouseStockViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductStockSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        warehouse_id = self.kwargs.get('warehouse_pk')
        return ProductStock.objects.filter(
            warehouse_id=warehouse_id
        ).select_related('product', 'warehouse')