# api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('revenue-stats/', views.get_revenue_stats, name='revenue-stats'),
    path('revenue-chart/', views.get_revenue_chart_data, name='revenue-chart'),
    path('revenue-daily/', views.get_revenue_daily_data, name='revenue-daily'),
    path('daily-stats/', views.get_daily_stats, name='daily-stats'),
    path('top-categories/', views.get_top_categories, name='top-categories'),
    path('low-stock-products/', views.get_low_stock_products, name='low-stock-products'),
]