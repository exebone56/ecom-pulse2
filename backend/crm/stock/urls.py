from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductStockViewSet

router = DefaultRouter()
router.register(r'stocks', ProductStockViewSet, basename='stock')

urlpatterns = [
    path('', include(router.urls)),
]