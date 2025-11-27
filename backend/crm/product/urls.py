from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, ProductImageViewSet, MarketplaceViewSet, FilterOptionsView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products/(?P<product_pk>\d+)/images', ProductImageViewSet, basename='product-images')
router.register(r'marketplaces', MarketplaceViewSet, basename='marketplace')

urlpatterns = [
    path('', include(router.urls)),
    path('filter-options/', FilterOptionsView.as_view(), name='filter-options'),
]