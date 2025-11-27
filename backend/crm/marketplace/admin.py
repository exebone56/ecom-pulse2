# marketplace/admin.py
from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Marketplace, MarketplaceProduct

class MarketplaceAdminForm(forms.ModelForm):
    """Форма для админки с виджетами PasswordInput"""
    
    class Meta:
        model = Marketplace
        fields = '__all__'
        widgets = {
            'api_key': forms.PasswordInput(render_value=True, attrs={'placeholder': 'Введите API ключ'}),
            'client_secret': forms.PasswordInput(render_value=True, attrs={'placeholder': 'Введите Client Secret'}),
            'webhook_url': forms.URLInput(attrs={'placeholder': 'https://example.com/webhook'}),
        }

    def clean(self):
        """Кастомная валидация"""
        cleaned_data = super().clean()

        if (cleaned_data.get('environment') == Marketplace.Environment.PRODUCTION and 
            cleaned_data.get('status') == Marketplace.Status.TESTING):
            self.add_warning('status', 'Тестирование на production окружении не рекомендуется')
        
        return cleaned_data

@admin.register(Marketplace)
class MarketplaceAdmin(admin.ModelAdmin):
    form = MarketplaceAdminForm
    
    list_display = [
        'name', 'code', 'environment_display', 'status_display',
        'parsing_interval', 'last_sync_display', 'is_webhook_enabled_display'
    ]
    
    list_filter = ['code', 'environment', 'status', 'is_webhook_enabled']
    
    list_editable = ['parsing_interval']
    
    search_fields = ['name', 'code']
    readonly_fields = ['created_at', 'updated_at', 'last_successful_sync']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'status', 'environment')
        }),
        ('Учетные данные API (шифруются)', {
            'fields': ('api_key', 'client_id', 'client_secret')
        }),
        ('Специфичные настройки', {
            'fields': ('campaign_id', 'seller_id', 'warehouse_id', 'extra_credentials')
        }),
        ('Настройки парсинга', {
            'fields': ('parsing_interval', 'max_orders_per_request', 'days_to_look_back')
        }),
        ('Вебхуки', {
            'fields': ('is_webhook_enabled', 'webhook_url'),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at', 'last_successful_sync'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['test_connection', 'enable_marketplaces', 'disable_marketplaces']
    
    def environment_display(self, obj):
        color = "green" if obj.environment == Marketplace.Environment.PRODUCTION else "orange"
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            obj.get_environment_display()
        )
    environment_display.short_description = "Окружение"
    
    def status_display(self, obj):
        colors = {
            Marketplace.Status.ACTIVE: "green",
            Marketplace.Status.INACTIVE: "red", 
            Marketplace.Status.TESTING: "orange"
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, "black"),
            obj.get_status_display()
        )
    status_display.short_description = "Статус"
    
    def last_sync_display(self, obj):
        if obj.last_successful_sync:
            return obj.last_successful_sync.strftime("%d.%m.%Y %H:%M")
        return "Никогда"
    last_sync_display.short_description = "Последняя синхронизация"
    
    def is_webhook_enabled_display(self, obj):
        return "✅" if obj.is_webhook_enabled else "❌"
    is_webhook_enabled_display.short_description = "Вебхуки"
    
    def test_connection(self, request, queryset):
        """Тестирует подключение к выбранным маркетплейсам"""
        for marketplace in queryset:
            success = marketplace.test_connection()
            if success:
                self.message_user(request, f"✅ {marketplace.name}: Подключение успешно")
            else:
                self.message_user(request, f"❌ {marketplace.name}: Ошибка подключения", level='error')
    test_connection.short_description = "Протестировать подключение"
    
    def enable_marketplaces(self, request, queryset):
        """Активирует выбранные маркетплейсы"""
        updated = queryset.update(status=Marketplace.Status.ACTIVE)
        self.message_user(request, f"Активировано {updated} маркетплейсов")
    enable_marketplaces.short_description = "Активировать маркетплейсы"
    
    def disable_marketplaces(self, request, queryset):
        """Деактивирует выбранные маркетплейсы"""
        updated = queryset.update(status=Marketplace.Status.INACTIVE)
        self.message_user(request, f"Деактивировано {updated} маркетплейсов")
    disable_marketplaces.short_description = "Деактивировать маркетплейсы"

@admin.register(MarketplaceProduct)
class MarketplaceProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'marketplace', 'barcode', 'external_sku', 'status')
    list_filter = ('marketplace', 'status', 'sync_enabled')
    search_fields = (
        'product__article', 
        'product__name', 
        'barcode', 
        'external_sku',
        'external_product_id'
    )
    autocomplete_fields = ['product']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'marketplace')