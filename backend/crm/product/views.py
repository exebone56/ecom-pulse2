# views.py - обновим ProductViewSet
from rest_framework import viewsets, filters, permissions
from rest_framework.views import APIView
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from .models import Product, Category, ProductImage, Country, ProductDirection
from .serializers import ProductListSerializer, ProductDetailSerializer, CategorySerializer, ProductImageSerializer
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response
from marketplace.models import Marketplace, MarketplaceProduct
from marketplace.serializers import MarketplaceSerializer, MarketplaceProductSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication


from users.permissions import IsManager, IsWarehouseManager, IsOrderPicker


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class FilterOptionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Получить опции для фильтров"""
        countries = Country.objects.filter(is_active=True)
        directions = ProductDirection.objects.filter(is_active=True)
        categories = Category.objects.filter(is_active=True)
        
        return Response({
            'countries': [
                {
                    'id': country.id,
                    'name': country.name,
                    'code': country.code
                }
                for country in countries
            ],
            'directions': [
                {
                    'id': direction.id,
                    'name': direction.name,
                    'code': direction.code
                }
                for direction in directions
            ],
            'categories': [
                {
                    'id': category.id,
                    'name': category.name
                }
                for category in categories
            ]
        })

class ProductFilter(django_filters.FilterSet):
    countries = django_filters.ModelMultipleChoiceFilter(
        field_name='country',
        queryset=Country.objects.filter(is_active=True)
    )
    directions = django_filters.ModelMultipleChoiceFilter(
        field_name='direction', 
        queryset=ProductDirection.objects.filter(is_active=True)
    )
    category_name = django_filters.CharFilter(
        field_name='category__name', 
        lookup_expr='icontains'
    )

    class Meta:
        model = Product
        fields = {
            'category': ['exact'],
            'is_active': ['exact'],
            'created_at': ['gte', 'lte'],
        }

class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet для товаров"""
    pagination_class = StandardResultsSetPagination
    queryset = Product.objects.all().select_related(
        'category', 'country', 'direction'
    ).prefetch_related(
        'additional_images',
        'marketplace_products',
        'marketplace_products__marketplace'
    )
    serializer_class = ProductListSerializer
    authentication_classes = [JWTAuthentication, SessionAuthentication, BasicAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['article', 'name']
    ordering_fields = ['article', 'created_at', 'packing_weight']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        Кастомные права для всех действий включая кастомные экшены
        """
        if self.action in ['retrieve', 'list']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['create', 'update', 'partial_update', 'marketplace_product']:
            return [IsManager() | IsWarehouseManager()]
        elif self.action in ['destroy']:
            return [IsManager()]
        else:
            return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update', 'create']:
            return ProductDetailSerializer
        return ProductListSerializer
    
    @action(detail=True, methods=['get', 'put', 'delete'], url_path=r'marketplace-products/(?P<marketplace_id>\d+)')
    def marketplace_product(self, request, pk=None, marketplace_id=None):
        """Работа с товаром на конкретном маркетплейсе для данного продукта"""
        product = self.get_object()
        marketplace = get_object_or_404(Marketplace, id=marketplace_id)

        if request.method == 'GET':
            try:
                marketplace_product = MarketplaceProduct.objects.get(
                    product=product, 
                    marketplace=marketplace
                )
                serializer = MarketplaceProductSerializer(marketplace_product)
                return Response(serializer.data)
            except MarketplaceProduct.DoesNotExist:
                return Response(
                    {'detail': 'Товар не найден на указанном маркетплейсе'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        elif request.method == 'PUT':
            data = request.data.copy()
            
            allowed_fields = ['barcode', 'external_sku', 'external_product_id', 'status', 'sync_enabled']
            update_data = {key: data[key] for key in allowed_fields if key in data}
            
            marketplace_product, created = MarketplaceProduct.objects.update_or_create(
                product=product,
                marketplace=marketplace,
                defaults=update_data
            )
            
            serializer = MarketplaceProductSerializer(marketplace_product)
            return Response(serializer.data)
            
        elif request.method == 'DELETE':
            marketplace_product = get_object_or_404(
                MarketplaceProduct, 
                product=product, 
                marketplace=marketplace
            )
            marketplace_product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'], url_path="marketplace-products-list")
    def marketplace_products(self, request, pk=None):
        """Получить все маркетплейсы для данного продукта"""
        product = self.get_object()
        marketplace_products = MarketplaceProduct.objects.filter(product=product)
        serializer = MarketplaceProductSerializer(marketplace_products, many=True)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для категорий"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk'])
    
    def perform_create(self, serializer):
        product = get_object_or_404(Product, id=self.kwargs['product_pk'])
        serializer.save(product=product)

class MarketplaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Marketplace.objects.filter(status=Marketplace.Status.ACTIVE)
    serializer_class = MarketplaceSerializer
    permission_classes = [permissions.AllowAny]
