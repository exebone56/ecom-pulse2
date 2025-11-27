# order/views.py

from rest_framework import generics, permissions
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from .models import Order
from .serializers import OrderSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Order.objects.select_related('marketplace').prefetch_related('items__product__product')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(number__icontains=search) |
                Q(items__product__product__article__icontains=search)
            ).distinct()
        
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at_marketplace__gte=date_from)
            
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at_marketplace__lte=date_to)
            
        amount_from = self.request.query_params.get('amount_from')
        if amount_from:
            queryset = queryset.filter(total_amount__gte=amount_from)
            
        amount_to = self.request.query_params.get('amount_to')
        if amount_to:
            queryset = queryset.filter(total_amount__lte=amount_to)

        return queryset.order_by('-created_at_marketplace')