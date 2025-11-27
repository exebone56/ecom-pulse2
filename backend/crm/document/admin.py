# documents/admin.py
from django.contrib import admin
from .models import Document, DocumentItem

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['document_number', 'document_type', 'status', 'partner', 'total_cost']
    list_filter = ['document_type', 'status']

@admin.register(DocumentItem)
class DocumentItemAdmin(admin.ModelAdmin):
    list_display = ['document', 'product', 'quantity', 'price']