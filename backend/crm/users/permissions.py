# users/permissions.py
from rest_framework import permissions

class IsDirector(permissions.BasePermission):
    """Доступ только для руководителя"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_director()
    
    def __or__(self, other):
        return OrPermission(self, other)

class IsSeniorManager(permissions.BasePermission):
    """Доступ для старшего менеджера и выше"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_director() or 
            request.user.is_senior_manager()
        )
    
    def __or__(self, other):
        return OrPermission(self, other)

class IsManager(permissions.BasePermission):
    """Доступ для менеджера и выше"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_director() or 
            request.user.is_senior_manager() or
            request.user.is_manager()
        )
    
    def __or__(self, other):
        return OrPermission(self, other)

class IsWarehouseManager(permissions.BasePermission):
    """Доступ для заведующего складом и выше"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_director() or 
            request.user.is_senior_manager() or
            request.user.is_manager() or
            request.user.is_warehouse_manager()
        )
    
    def __or__(self, other):
        return OrPermission(self, other)

class IsOrderPicker(permissions.BasePermission):
    """Доступ для сборщика заказов и выше"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_director() or 
            request.user.is_senior_manager() or
            request.user.is_manager() or
            request.user.is_warehouse_manager() or
            request.user.is_order_picker()
        )
    
    def __or__(self, other):
        return OrPermission(self, other)

class OrPermission(permissions.BasePermission):
    """Permission который объединяет два других через OR"""
    def __init__(self, perm1, perm2):
        self.perm1 = perm1
        self.perm2 = perm2
    
    def has_permission(self, request, view):
        return (self.perm1.has_permission(request, view) or 
                self.perm2.has_permission(request, view))
    
    def has_object_permission(self, request, view, obj):
        return (self.perm1.has_object_permission(request, view, obj) or 
                self.perm2.has_object_permission(request, view, obj))