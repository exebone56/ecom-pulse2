// pages/DocumentViewPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../../services/documentServices';
import MainLayout from '../Layout/MainLayout';
import Button from '../UI/Buttons/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const documentData = await documentService.getDocumentById(id);
      setDocument(documentData);
    } catch (err) {
      setError('Ошибка при загрузке документа: ' + err.message);
      console.error('Error loading document:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      'incoming': 'Поступление',
      'outgoing': 'Списание',
      'inventory': 'Инвентаризация',
      'return': 'Возврат',
      'transfer': 'Перемещение'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'draft': 'Черновик',
      'pending': 'На согласовании',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? 'bg-green-100 text-green-800' :
           status === 'draft' ? 'bg-gray-100 text-gray-800' :
           status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
           'bg-red-100 text-red-800';
  };

  const getWarehouseName = (warehouseId, type) => {
    if (!document) return '—';
    
    if (type === 'source') {
      return document.source_warehouse_name || '—';
    } else {
      return document.destination_warehouse_name || '—';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      </MainLayout>
    );
  }

  if (!document) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <div className="text-lg font-medium text-gray-700 mb-2">Документ не найден</div>
          <Button
            bgColor="#3b82f6"
            onClick={() => navigate('/documents')}
            className="px-6 py-2 rounded-lg"
          >
            Вернуться к списку
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalProducts = document.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalCost = document.items?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;

  return (
    <MainLayout>
      {/* Уведомления */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Заголовок */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              title="Назад к списку"
            >
              <ArrowBackIcon className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Документ #{document.document_number}</h1>
              <p className="text-gray-300">Просмотр документа</p>
            </div>
          </div>
          <div className="flex gap-2">
            {document.status === 'draft' && (
              <Button
                bgColor="#f59e0b"
                onClick={() => navigate(`/documents/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
              >
                <EditIcon />
                Редактировать
              </Button>
            )}
            <Button
              bgColor="#6b7280"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <PrintIcon />
              Печать
            </Button>
            <Button
              bgColor="#10b981"
              onClick={() => {/* TODO: реализовать экспорт */}}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <DownloadIcon />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Информация о документе */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Тип документа</div>
            <div className="font-semibold text-gray-900">{getDocumentTypeLabel(document.document_type)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Статус</div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
              {getStatusLabel(document.status)}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Дата создания</div>
            <div className="font-semibold text-gray-900">
              {new Date(document.created_at).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Левая панель - информация о документе */}
        <div className="flex flex-col w-1/3 shrink-0">
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Информация о документе</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер документа
                </label>
                <div className="font-medium text-gray-900">{document.document_number}</div>
              </div>

              {document.partner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Партнер
                  </label>
                  <div className="text-gray-900">{document.partner}</div>
                </div>
              )}

              {/* Склады */}
              {document.document_type === 'incoming' && document.destination_warehouse_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Склад назначения
                  </label>
                  <div className="text-gray-900">{document.destination_warehouse_name}</div>
                </div>
              )}

              {document.document_type === 'outgoing' && document.source_warehouse_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Склад-источник
                  </label>
                  <div className="text-gray-900">{document.source_warehouse_name}</div>
                </div>
              )}

              {document.document_type === 'transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Склад-источник
                    </label>
                    <div className="text-gray-900">{document.source_warehouse_name || '—'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Склад назначения
                    </label>
                    <div className="text-gray-900">{document.destination_warehouse_name || '—'}</div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Валюта
                </label>
                <div className="text-gray-900">{document.currency}</div>
              </div>

              {document.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Примечания
                  </label>
                  <div className="text-gray-900 whitespace-pre-wrap">{document.notes}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Создатель
                </label>
                <div className="text-gray-900">
                  {document.created_by_info?.first_name && document.created_by_info?.last_name 
                    ? `${document.created_by_info.first_name} ${document.created_by_info.last_name}`
                    : document.created_by_info?.username || '—'
                  }
                </div>
              </div>
            </div>

            {/* Итоговая информация */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Всего товаров:</span>
                  <span className="font-semibold text-gray-900">{totalProducts} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Общая стоимость:</span>
                  <span className="font-semibold text-gray-900">{totalCost.toLocaleString('ru-RU')} {document.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Количество позиций:</span>
                  <span className="font-semibold text-gray-900">{document.items?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая панель - товары */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            {/* Заголовок */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Товары в документе</h3>
              <div className="text-sm text-gray-600">
                Позиций: <span className="font-semibold text-gray-900">{document.items?.length || 0}</span>
              </div>
            </header>

            {/* Список товаров */}
            <div className="p-4">
              {document.items && document.items.length > 0 ? (
                <div className="space-y-3">
                  {document.items.map((item, index) => {
                    const product = item.product_info;
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white">
                        {/* Изображение товара */}
                        <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden">
                          {product?.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                              📷
                            </div>
                          )}
                        </div>
                        
                        {/* Информация о товаре */}
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Артикул
                            </label>
                            <div className="font-medium text-gray-900">{product?.article || 'N/A'}</div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Наименование
                            </label>
                            <div className="text-sm text-gray-900">{product?.name || 'N/A'}</div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Количество
                            </label>
                            <div className="font-medium text-gray-900">{item.quantity} шт.</div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Цена
                            </label>
                            <div className="font-medium text-gray-900">
                              {parseFloat(item.price || 0).toLocaleString('ru-RU')} {document.currency}
                            </div>
                          </div>
                        </div>
                        
                        {/* Итог */}
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Стоимость</div>
                          <div className="font-semibold text-gray-900">
                            {(item.total_cost || 0).toLocaleString('ru-RU')} {document.currency}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-lg font-medium text-gray-700 mb-2">Нет товаров в документе</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentViewPage;