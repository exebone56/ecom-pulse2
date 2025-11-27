# warehouse/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
import pandas as pd
from django.http import HttpResponse
from product.models import Product
from stock.models import ProductStock
from .models import ProductStock
from .serializers import (
    ProductStockSerializer, 
    StockUpdateSerializer,
    BulkStockUpdateSerializer
)
from users.permissions import IsWarehouseManager, IsManager
from rest_framework.pagination import PageNumberPagination

class ProductStockPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductStockViewSet(viewsets.ModelViewSet):
    """ViewSet для управления остатками товаров"""
    queryset = ProductStock.objects.all().select_related('product')
    serializer_class = ProductStockSerializer
    permission_classes = [IsWarehouseManager | IsManager]
    pagination_class = ProductStockPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        article = self.request.query_params.get('article')
        if article:
            queryset = queryset.filter(product__article__icontains=article)
        
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            queryset = [stock for stock in queryset if stock.is_low_stock()]
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_stock(self, request, pk=None):
        """Обновить только доступное количество конкретного товара"""
        stock = self.get_object()
        try:
            available_quantity = None
            
            if isinstance(request.data, dict):
                available_quantity = request.data.get('available_quantity')
            elif hasattr(request.data, 'get'):
                available_quantity = request.data.get('available_quantity')
            elif isinstance(request.data, (int, float, str)):
                available_quantity = request.data
            else:
                try:
                    body_data = json.loads(request.body)
                    available_quantity = body_data.get('available_quantity')
                except:
                    pass
                  
            if available_quantity is None:
                return Response(
                    {'error': 'Не указано available_quantity'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                new_quantity = int(available_quantity)
                if new_quantity < 0:
                    return Response(
                        {'error': 'Количество не может быть отрицательным'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                stock.available_quantity = new_quantity
                stock.save()
                       
                return Response(ProductStockSerializer(stock).data)
                
            except (ValueError, TypeError) as e:
                return Response(
                    {'error': f'available_quantity должно быть числом: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Внутренняя ошибка сервера: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        try:
            from product.models import Product
            from stock.models import ProductStock
        except ImportError as e:
            return Response(
                {'error': f'Ошибка загрузки моделей: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'Файл не найден в запросе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        results = {
            'success': 0,
            'errors': [],
            'updated': []
        }
        
        try:
            if uploaded_file.name.endswith('.csv'):
                file_content = uploaded_file.read().decode('utf-8')
                lines = file_content.splitlines()
                
                first_line = lines[0]
                if ';' in first_line:
                    delimiter = ';'
                elif ',' in first_line:
                    delimiter = ','
                elif '\t' in first_line:
                    delimiter = '\t'
                else:
                    delimiter = ';'
                
                uploaded_file.seek(0)
                df = pd.read_csv(uploaded_file, delimiter=delimiter, encoding='utf-8')
                
            elif uploaded_file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(uploaded_file)
            else:
                return Response(
                    {'error': 'Неподдерживаемый формат файла'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            required_columns = ['article', 'available_quantity']
            found_columns = df.columns.tolist()
            
            column_mapping = {
                'article': ['article', 'артикул', 'арт', 'art', 'sku'],
                'available_quantity': ['available_quantity', 'available', 'quantity', 'количество', 'остаток']
            }
            
            renamed_count = 0
            for required_col, possible_names in column_mapping.items():
                for possible_name in possible_names:
                    if possible_name in found_columns and required_col not in found_columns:
                        df = df.rename(columns={possible_name: required_col})
                        renamed_count += 1
                        break
            
            found_columns = df.columns.tolist()
            missing_columns = [col for col in required_columns if col not in found_columns]
            
            if missing_columns:
                return Response(
                    {'error': f'Отсутствуют колонки: {missing_columns}. Найдены: {found_columns}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            df = df.where(pd.notnull(df), None)
            for col in df.columns:
                if df[col].dtype == 'object':
                    df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
            
            df_data = df.to_dict('records')
            
            with transaction.atomic():
                for index, row in enumerate(df_data, start=2):
                    try:
                        article = str(row['article']).strip() if row['article'] else None
                        if not article:
                            results['errors'].append(f"Строка {index}: пустой артикул")
                            continue

                        try:
                            stock = ProductStock.objects.select_related('product').get(
                                product__article=article
                            )
  
                        except ProductStock.DoesNotExist:
                            error_msg = f"Товар с артикулом '{article}' не найден в остатках"
                            results['errors'].append(f"Строка {index}: {error_msg}")

                            product_exists = Product.objects.filter(article=article).exists()
                            if product_exists:
                                try:
                                    product = Product.objects.get(article=article)
                                    stock = ProductStock.objects.create(
                                        product=product,
                                        available_quantity=0
                                    )
                                except Exception as e:
                                    pass
                            continue
                        
                        available_quantity = row['available_quantity']
                        if available_quantity is None:
                            results['errors'].append(f"Строка {index}, артикул {article}: пустое значение количества")
                            continue
                        
                        try:
                            if isinstance(available_quantity, (int, float)):
                                quantity = int(available_quantity)
                            elif isinstance(available_quantity, str):
                                cleaned_value = available_quantity.strip().replace(' ', '')
                                if not cleaned_value:
                                    results['errors'].append(f"Строка {index}, артикул {article}: пустое значение количества")
                                    continue
                                quantity = int(float(cleaned_value))
                            else:
                                results['errors'].append(f"Строка {index}, артикул {article}: неверный формат количества")
                                continue
                            
                            if quantity < 0:
                                results['errors'].append(f"Строка {index}, артикул {article}: количество не может быть отрицательным")
                                continue
    
                            old_quantity = stock.available_quantity
                            stock.available_quantity = quantity
                            stock.save()
                            
                            stock.refresh_from_db()
                            
                            if stock.available_quantity == quantity:
                                results['success'] += 1
                                results['updated'].append({
                                    'article': article,
                                    'available_quantity': quantity,
                                    'previous_quantity': old_quantity,
                                    'product_name': stock.product.name
                                })
                            else:
                                error_msg = f"Не удалось обновить остаток"
                                results['errors'].append(f"Строка {index}: {error_msg}")
                            
                        except (ValueError, TypeError) as e:
                            results['errors'].append(f"Строка {index}, артикул {article}: неверное значение количества '{available_quantity}'")
                        
                    except Exception as e:
                        error_msg = f"Строка {index}, артикул {article}: {str(e)}"
                        results['errors'].append(error_msg)
                 
            return Response(results)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка обработки файла: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """CSV шаблон"""
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="stock_template.csv"'
        
        response.write('article;available_quantity\n')
        response.write('EXAMPLE001;100\n')
        response.write('EXAMPLE002;50\n')
        
        return response
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Получить товары с низким остатком"""
        low_stock_items = [stock for stock in self.get_queryset() if stock.is_low_stock()]
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)