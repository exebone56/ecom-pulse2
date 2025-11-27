from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Order, OrderItem
from marketplace.models import Marketplace

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = ('product', 'quantity', 'price', 'total')
    readonly_fields = ('product', 'quantity', 'price', 'total')

    def total(self, obj):
        if obj.price is None:
            return 0
        return obj.quantity * obj.price
    total.short_description = 'Сумма'

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'number',
        'external_id',
        'marketplace',
        'status',
        'total_amount',
        'created_at_marketplace',
        'created_at'
    )
    list_filter = (
        'marketplace',
        'status',
        'created_at_marketplace'
    )
    search_fields = (
        'number',
        'external_id',
        'posting_number'
    )
    readonly_fields = (
        'external_id',
        'number',
        'posting_number',
        'marketplace',
        'total_amount',
        'created_at_marketplace'
    )
    inlines = [OrderItemInline]
    ordering = ('-created_at_marketplace',)
    list_per_page = 25

    def get_queryset(self, request):
        # Оптимизация: 2 запроса вместо N+1
        return super().get_queryset(request).select_related(
            'marketplace'
        ).prefetch_related(
            'items__product__product'
        )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return False
