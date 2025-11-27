# documents/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, DocumentItemViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-items', DocumentItemViewSet, basename='document-item')

urlpatterns = [
    path('', include(router.urls)),
]