# api/views.py
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from order.models import Order
from rest_framework.pagination import PageNumberPagination
from stock.models import ProductStock

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_revenue_stats(request):
    today = timezone.now().date()
    first_day_current_month = today.replace(day=1)
    first_day_previous_month = (first_day_current_month - timedelta(days=1)).replace(day=1)
    
    current_month_revenue = Order.objects.filter(
        created_at_marketplace__gte=first_day_current_month,
        status__in=['new', 'delivered']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    previous_month_revenue = Order.objects.filter(
        created_at_marketplace__gte=first_day_previous_month,
        created_at_marketplace__lt=first_day_current_month,
        status__in=['new', 'delivered']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    if previous_month_revenue > 0:
        percentage_change = ((current_month_revenue - previous_month_revenue) / previous_month_revenue) * 100
    else:
        percentage_change = 100 if current_month_revenue > 0 else 0
    
    return Response({
        'current_month_revenue': float(current_month_revenue),
        'previous_month_revenue': float(previous_month_revenue),
        'percentage_change': round(percentage_change, 1),
        'is_positive': percentage_change >= 0
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_revenue_chart_data(request):
    try:
        marketplace_ids = request.GET.get('marketplaces', 'all')
        month_names = {
            1: 'Янв', 2: 'Фев', 3: 'Мар', 4: 'Апр', 5: 'Май', 6: 'Июн',
            7: 'Июл', 8: 'Авг', 9: 'Сен', 10: 'Окт', 11: 'Ноя', 12: 'Дек'
        }
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        orders = Order.objects.filter(
            created_at_marketplace__date__gte=start_date,
            created_at_marketplace__date__lte=end_date,
            status__in=[Order.Status.NEW, Order.Status.SHIPPED, Order.Status.DELIVERED]
        )
        
        if marketplace_ids != 'all':
            orders = orders.filter(marketplace_id=marketplace_ids)
        
        months_data = {}
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date.replace(day=1):
            month_key = current_date.strftime('%Y-%m')
            month_label = month_names[current_date.month]
            months_data[month_key] = {
                'label': month_label,
                'revenue': 0.0
            }
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        for order in orders:
            if order.created_at_marketplace:
                month_key = order.created_at_marketplace.strftime('%Y-%m')
                if month_key in months_data:
                    months_data[month_key]['revenue'] += float(order.total_amount)
        
        sorted_months = sorted(months_data.keys())
        last_12_months = sorted_months[-12:]
        
        months = [months_data[key]['label'] for key in last_12_months]
        revenue_data = [months_data[key]['revenue'] for key in last_12_months]
        
        return Response({
            'months': months,
            'revenue_data': revenue_data,
            'total_revenue': sum(revenue_data)
        })
        
    except Exception as e:
        logger.error(f"Error in get_revenue_chart_data: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_revenue_daily_data(request):
    try:
        marketplace_ids = request.GET.get('marketplaces', 'all')
        
        today = timezone.now().date()
        first_day_current_month = today.replace(day=1)
        
        orders = Order.objects.filter(
            created_at_marketplace__date__gte=first_day_current_month,
            created_at_marketplace__date__lte=today,
            status__in=[Order.Status.NEW, Order.Status.SHIPPED, Order.Status.DELIVERED]
        )
        
        if marketplace_ids != 'all':
            orders = orders.filter(marketplace_id=marketplace_ids)
        
        days_data = {}
        current_date = first_day_current_month
        
        while current_date <= today:
            day_key = current_date.strftime('%Y-%m-%d')
            day_label = str(current_date.day)
            days_data[day_key] = {
                'label': day_label,
                'revenue': 0.0
            }
            current_date += timedelta(days=1)
        
        for order in orders:
            if order.created_at_marketplace:
                day_key = order.created_at_marketplace.strftime('%Y-%m-%d')
                if day_key in days_data:
                    days_data[day_key]['revenue'] += float(order.total_amount)
        
        sorted_days = sorted(days_data.keys())
        
        days = [days_data[key]['label'] for key in sorted_days]
        revenue_data = [days_data[key]['revenue'] for key in sorted_days]
        
        return Response({
            'days': days,
            'revenue_data': revenue_data,
            'total_revenue': sum(revenue_data),
            'month': today.strftime('%B %Y')
        })
        
    except Exception as e:
        logger.error(f"Error in get_revenue_daily_data: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_daily_stats(request):
    try:
        today = timezone.now().date()
        
        today_orders = Order.objects.filter(
            created_at_marketplace__date=today
        )
        
        total_sales = today_orders.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        orders_count = today_orders.count()
        
        delivered_orders = today_orders.filter(
            status=Order.Status.DELIVERED
        )
        delivered_amount = delivered_orders.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        delivered_count = delivered_orders.count()
        
        cancelled_orders = today_orders.filter(
            status=Order.Status.CANCELLED
        )
        cancelled_count = cancelled_orders.count()
        
        return Response({
            'date': today.strftime('%d.%m.%Y'),
            'total_sales': float(total_sales),
            'orders_count': orders_count,
            'delivered_amount': float(delivered_amount),
            'delivered_count': delivered_count,
            'cancelled_count': cancelled_count,
        })
        
    except Exception as e:
        logger.error(f"Error in get_daily_stats: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_top_categories(request):
    try:
        today = timezone.now().date()
        first_day_month = today.replace(day=1)
        
        from django.db.models import Count, Sum
        
        top_categories = Order.objects.filter(
            created_at_marketplace__date__gte=first_day_month,
            created_at_marketplace__date__lte=today,
            status__in=[Order.Status.DELIVERED, Order.Status.SHIPPED]
        ).values(
            'items__product__product__category__name'
        ).annotate(
            sales_count=Count('id'),
            total_amount=Sum('total_amount')
        ).order_by('-sales_count')[:5]
        
        categories_data = []
        for category in top_categories:
            category_name = category['items__product__product__category__name']
            if not category_name:
                continue 
                
            categories_data.append({
                'categoriesName': category_name,
                'sales': category['sales_count'],
                'total_amount': float(category['total_amount'] or 0)
            })
        
        if not categories_data:
            categories_data = [{
                'categoriesName': 'Нет данных по категориям',
                'sales': 0,
                'total_amount': 0
            }]
        
        return Response(categories_data)
        
    except Exception as e:
        logger.error(f"Error in get_top_categories: {str(e)}")
        return Response({'error': str(e)}, status=500)

class LowStockPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 5

@api_view(['GET'])
@permission_classes([AllowAny])
def get_low_stock_products(request):
    try:
        low_stock_products = ProductStock.objects.filter(
            available_quantity__lte=5
        ).select_related('product').order_by('available_quantity')
        
        paginator = LowStockPagination()
        result_page = paginator.paginate_queryset(low_stock_products, request)

        products_data = []
        for stock in result_page:
            product = stock.product
            products_data.append({
                'id': stock.id,
                'article': product.article,
                'available_quantity': stock.available_quantity,
                'total_reserved': stock.get_total_reserved(),
            })
        
        return paginator.get_paginated_response(products_data)
        
    except Exception as e:
        logger.error(f"Error in get_low_stock_products: {str(e)}")
        return Response({'error': str(e)}, status=500)