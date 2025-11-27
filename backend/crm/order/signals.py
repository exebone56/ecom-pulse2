# order/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Order, OrderItem
from .services import StockManagementService

@receiver(post_save, sender=OrderItem)
def handle_order_item_creation(sender, instance, created, **kwargs):
    """Обработка создания позиции заказа"""
    if created and instance.order.is_fbs():
        print(f"Создана позиция заказа для FBS заказа {instance.order.number}")
        try:
            StockManagementService.process_new_fbs_order(instance.order)
        except ValueError as e:
            print(f"Ошибка обработки позиции заказа: {e}")

@receiver(pre_save, sender=Order)
def handle_order_status_change(sender, instance, **kwargs):
    """Обработка изменения статуса заказа"""
    if not instance.pk:
        return
    
    try:
        old_order = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return
    
    if old_order.status != instance.status and instance.is_fbs():
        print(f"Статус заказа {instance.number} изменился с {old_order.status} на {instance.status}")
        
        if (old_order.status in [Order.Status.NEW, Order.Status.PROCESSING] and 
            instance.status == Order.Status.SHIPPED):
            StockManagementService.process_shipped_status(instance)
            print(f"Заказ {instance.number} отправлен, резерв уменьшен")
        
        elif (old_order.status in [Order.Status.NEW, Order.Status.PROCESSING] and 
              instance.status == Order.Status.CANCELLED):
            StockManagementService.cancel_fbs_order(instance)
            print(f"Заказ {instance.number} отменен, товар возвращен")