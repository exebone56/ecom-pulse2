from rest_framework import serializers
from .models import Product, ProductImage, Category, Country, ProductDirection
from marketplace.serializers import MarketplaceProductSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent']

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'code', 'name']

class ProductDirectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDirection
        fields = ['id', 'code', 'name']

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'alt_text', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"http://localhost:8000{obj.image.url}"
        return None

class ProductListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка товаров"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    direction_name = serializers.CharField(source='direction.name', read_only=True)
    marketplace_products = MarketplaceProductSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'article', 'main_img', 'description', 'is_active',
            'category_name', 'country_name',
            'direction_name', 'created_at', 'marketplace_products'
        ]

class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    main_img_url = serializers.SerializerMethodField()
    marketplace_products = MarketplaceProductSerializer(many=True, read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    direction_name = serializers.CharField(source='direction.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
    
    def get_main_img_url(self, obj):
        if obj.main_img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_img.url)
            return f"http://localhost:8000{obj.main_img.url}"
        return None

