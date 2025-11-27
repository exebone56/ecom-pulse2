# warehouse/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, WarehouseStockViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')

warehouse_stock_router = DefaultRouter()
warehouse_stock_router.register(r'stock', WarehouseStockViewSet, basename='warehouse-stock')

urlpatterns = [
    path('', include(router.urls)),
    path('warehouses/<int:warehouse_pk>/', include(warehouse_stock_router.urls)),
]