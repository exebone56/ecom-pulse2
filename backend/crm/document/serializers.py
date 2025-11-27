# documents/serializers.py
from rest_framework import serializers
from .models import Document, DocumentItem, DocumentHistory
from product.serializers import ProductListSerializer
from users.serializers import UserSerializer
from users.models import CustomUser
from product.models import Product

class DocumentItemSerializer(serializers.ModelSerializer):
    product_info = ProductListSerializer(source='product', read_only=True)
    
    class Meta:
        model = DocumentItem
        fields = [
            'id', 'product', 'product_info', 'quantity', 'price', 
            'total_cost', 'batch_number', 'expiration_date', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_cost', 'created_at', 'updated_at']


class DocumentHistorySerializer(serializers.ModelSerializer):
    user_info = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = DocumentHistory
        fields = ['id', 'user', 'user_info', 'action', 'description', 'changes', 'created_at']


class DocumentSerializer(serializers.ModelSerializer):
    items = DocumentItemSerializer(many=True, read_only=True)
    history = DocumentHistorySerializer(many=True, read_only=True)
    created_by_info = UserSerializer(source='created_by', read_only=True)
    source_warehouse_name = serializers.CharField(source='source_warehouse.name', read_only=True)
    destination_warehouse_name = serializers.CharField(source='destination_warehouse.name', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'document_type', 'document_number', 'status',
            'partner', 'source_warehouse', 'source_warehouse_name',
            'destination_warehouse', 'destination_warehouse_name',
            'total_products', 'total_cost', 'currency',
            'created_by', 'created_by_info', 'created_at', 'updated_at', 
            'completed_at', 'notes', 'items', 'history'
        ]
        read_only_fields = [
            'id', 'document_number', 'created_by', 'created_at', 'updated_at',
            'completed_at', 'total_products', 'total_cost'
        ]


class DocumentCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'document_number', 'document_type', 'partner', 'source_warehouse', 
            'destination_warehouse', 'currency', 'notes', 'status', 'items',
            'created_by', 'created_at'
        ]
        read_only_fields = [
            'id', 'document_number', 'created_by', 'created_at'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        
        if validated_data.get('status') == 'completed':
            validated_data['status'] = 'draft'

        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        else:
            try:
                default_user = CustomUser.objects.filter(is_active=True).first()
                if default_user:
                    validated_data['created_by'] = default_user
                else:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    default_user = User.objects.create_user(
                        username='default_user',
                        email='default@example.com',
                        password='defaultpassword123'
                    )
                    validated_data['created_by'] = default_user
            except Exception as e:
                raise serializers.ValidationError(f"Не удалось установить создателя документа: {str(e)}")
        
        document = Document.objects.create(**validated_data)
        
        for item_data in items_data:
            product_id = item_data.get('product')
            try:
                product = Product.objects.get(id=product_id)
                DocumentItem.objects.create(
                    document=document,
                    product=product,
                    quantity=item_data.get('quantity', 0),
                    price=item_data.get('price', 0),
                    total_cost=item_data.get('total_cost', 0),
                    batch_number=item_data.get('batch_number', ''),
                    expiration_date=item_data.get('expiration_date'),
                    notes=item_data.get('notes', '')
                )
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Продукт с ID {product_id} не найден")
        
        DocumentHistory.objects.create(
            document=document,
            user=document.created_by,
            action='created',
            description='Документ создан',
            changes={'status': document.status}
        )
        
        return document

class DocumentUpdateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'document_number', 'document_type', 'partner', 'source_warehouse', 
            'destination_warehouse', 'currency', 'notes', 'status', 'items'
        ]
        read_only_fields = ['id', 'document_number']
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            
            for item_data in items_data:
                product_id = item_data.get('product')
                try:
                    product = Product.objects.get(id=product_id)
                    DocumentItem.objects.create(
                        document=instance,
                        product=product,
                        quantity=item_data.get('quantity', 0),
                        price=item_data.get('price', 0),
                        total_cost=item_data.get('total_cost', 0),
                        batch_number=item_data.get('batch_number', ''),
                        expiration_date=item_data.get('expiration_date'),
                        notes=item_data.get('notes', '')
                    )
                except Product.DoesNotExist:
                    raise serializers.ValidationError(f"Продукт с ID {product_id} не найден")
        
        return instance