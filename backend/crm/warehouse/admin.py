# warehouse/admin.py
from django.contrib import admin
from .models import Warehouse

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'type', 'status', 'manager', 'address', 
        'phone', 'is_active', 'created_at'
    ]
    list_filter = ['type', 'status', 'is_active', 'created_at']
    search_fields = ['name', 'address', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    list_editable = ['status', 'is_active']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'status', 'description')
        }),
        ('Контактная информация', {
            'fields': ('address', 'phone', 'email')
        }),
        ('Управление', {
            'fields': ('manager', 'capacity')
        }),
        ('Системная информация', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('manager', 'created_by')