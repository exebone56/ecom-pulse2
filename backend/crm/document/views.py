# documents/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny
from .models import Document, DocumentItem, DocumentHistory
from .serializers import (
    DocumentSerializer, DocumentCreateSerializer, DocumentUpdateSerializer,
    DocumentItemSerializer
)
from users.permissions import IsWarehouseManager, IsManager

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.filter(is_deleted=False).select_related(
        'created_by', 'source_warehouse', 'destination_warehouse'
    ).prefetch_related('items', 'items__product', 'history')
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['document_type', 'status', 'created_by', 'destination_warehouse']
    search_fields = ['document_number', 'partner', 'items__product__article', 'items__product__name']
    ordering_fields = ['created_at', 'updated_at', 'total_cost', 'total_products']
    ordering = ['-created_at']
    
    permission_classes = [AllowAny]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DocumentUpdateSerializer
        return DocumentSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
            
        return queryset
     
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        document = self.get_object()
        
        if not document.can_edit():
            return Response(
                {'error': 'Нельзя редактировать документ в текущем статусе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DocumentItemSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    item = serializer.save(document=document)
                    
                    DocumentHistory.objects.create(
                        document=document,
                        user=request.user,
                        action='item_added',
                        description=f'Добавлен товар {item.product.article}',
                        changes={'product': item.product.article, 'quantity': item.quantity}
                    )
                
                return Response(DocumentItemSerializer(item).data)
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_item(self, request, pk=None):
        document = self.get_object()
        
        if not document.can_edit():
            return Response(
                {'error': 'Нельзя редактировать документ в текущем статусе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item_id = request.data.get('item_id')
        try:
            item = DocumentItem.objects.get(id=item_id, document=document)
        except DocumentItem.DoesNotExist:
            return Response(
                {'error': 'Позиция не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DocumentItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            old_data = {
                'quantity': item.quantity,
                'price': item.price
            }
            
            item = serializer.save()
            
            DocumentHistory.objects.create(
                document=document,
                user=request.user,
                action='item_updated',
                description=f'Обновлен товар {item.product.article}',
                changes={'old_data': old_data, 'new_data': request.data}
            )
            
            return Response(DocumentItemSerializer(item).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        document = self.get_object()
        
        if not document.can_edit():
            return Response(
                {'error': 'Нельзя редактировать документ в текущем статусе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item_id = request.data.get('item_id')
        try:
            item = DocumentItem.objects.get(id=item_id, document=document)
            
            with transaction.atomic():
                product_info = item.product.article
                item.delete()
                
                DocumentHistory.objects.create(
                    document=document,
                    user=request.user,
                    action='item_deleted',
                    description=f'Удален товар {product_info}',
                    changes={'product': product_info}
                )
            
            return Response({'success': True})
            
        except DocumentItem.DoesNotExist:
            return Response(
                {'error': 'Позиция не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        document = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'Не указан статус'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(Document.STATUS_CHOICES):
            return Response(
                {'error': 'Неверный статус'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = document.status
        document.status = new_status
        document.save()
        
        return Response(DocumentSerializer(document).data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        document = self.get_object()
        
        if document.status != 'completed':
            try:
                with transaction.atomic():
                    if document.document_type == 'incoming':
                        self._process_incoming_document(document)
                    elif document.document_type == 'outgoing':
                        self._process_outgoing_document(document)
                    elif document.document_type == 'inventory':
                        self._process_inventory_document(document)
                    elif document.document_type == 'transfer':
                        self._process_transfer_document(document)
                    
                    document.status = 'completed'
                    document.save()
                
                return Response(DocumentSerializer(document).data)
                
            except Exception as e:
                return Response(
                    {'error': f'Ошибка при завершении документа: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {'error': 'Документ уже завершен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def _process_incoming_document(self, document):
        from warehouse.models import ProductStock
        
        for item in document.items.all():
            try:
                stock, created = ProductStock.objects.get_or_create(
                    product=item.product,
                    defaults={'available_quantity': 0}
                )
                
                stock.available_quantity += item.quantity
                stock.save()
                
                DocumentHistory.objects.create(
                    document=document,
                    user=document.created_by,
                    action='stock_updated',
                    description=f'Увеличен остаток товара {item.product.article} на {item.quantity}',
                    changes={
                        'product': item.product.article,
                        'quantity_added': item.quantity,
                        'new_stock': stock.available_quantity,
                        'warehouse': document.destination_warehouse.name if document.destination_warehouse else 'Основной'
                    }
                )
                
            except Exception as e:
                raise

class DocumentItemViewSet(viewsets.ModelViewSet):
    queryset = DocumentItem.objects.select_related('document', 'product')
    serializer_class = DocumentItemSerializer
    permission_classes = [IsWarehouseManager | IsManager]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        document_id = self.request.query_params.get('document')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        return queryset