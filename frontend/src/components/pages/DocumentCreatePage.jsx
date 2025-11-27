// pages/DocumentCreatePage.jsx
import { useState, useEffect } from 'react';
import { documentService } from '../../services/documentServices';
import { warehouseService } from '../../services/warehouseServices';
import { productApi } from '../../services/productApi';
import MainLayout from '../Layout/MainLayout';
import Button from '../UI/Buttons/Button';
import Input from '../UI/Buttons/Input';
import SelectFilter from '../UI/SelectFilter';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import ProductSelectionModal from '../Modals/ProductSelectionModal';

const DocumentCreatePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [documentData, setDocumentData] = useState({
    document_type: 'incoming',
    partner: '',
    source_warehouse: '',
    destination_warehouse: '',
    currency: 'RUB',
    notes: '',
    items: []
  });
  
  const [warehouses, setWarehouses] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const warehousesData = await warehouseService.getWarehouses();
      setWarehouses(warehousesData.results || warehousesData);
      
      const productsData = await productApi.getProducts();
      setAvailableProducts(productsData.results || productsData);
      
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerChange = (value) => {
    const partnerValue = typeof value === 'string' ? value : 
                        value?.target?.value || '';
    setDocumentData(prev => ({
      ...prev,
      partner: partnerValue
    }));
  };

  const updateDocumentField = (field, value) => {
    setDocumentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateProductField = (productId, field, value) => {
    setDocumentData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.product === productId) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'quantity' || field === 'price') {
            const quantity = field === 'quantity' ? parseInt(value) || 0 : item.quantity;
            const price = field === 'price' ? parseFloat(value) || 0 : item.price;
            updatedItem.total_cost = quantity * price;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleQuantityChange = (productId, value) => {
    const quantityValue = typeof value === 'string' ? value : 
                         value?.target?.value || '';
    updateProductField(productId, 'quantity', parseInt(quantityValue) || 0);
  };

  const handlePriceChange = (productId, value) => {
    const priceValue = typeof value === 'string' ? value : 
                      value?.target?.value || '';
    updateProductField(productId, 'price', parseFloat(priceValue) || 0);
  };

  const deleteProduct = (productId) => {
    setDocumentData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product !== productId)
    }));
  };

  const addSelectedProduct = (product) => {
    const existingItem = documentData.items.find(item => item.product === product.id);
    
    if (existingItem) {
      updateProductField(product.id, 'quantity', existingItem.quantity + 1);
    } else {
      const newItem = {
        product: product.id,
        quantity: 1,
        price: product.price || 0,
        total_cost: product.price || 0,
        batch_number: '',
        expiration_date: '',
        notes: ''
      };

      setDocumentData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
    
    setIsProductModalOpen(false);
    setSearchTerm('');
  };

const handleSaveDocument = async (status = 'draft') => {
  try {
    setLoading(true);
    setError(null);
    
    if (documentData.items.length === 0) {
      setError('Добавьте хотя бы один товар в документ');
      setLoading(false);
      return;
    }

    if (documentData.document_type === 'incoming' && !documentData.destination_warehouse) {
      setError('Для приходного документа обязателен склад назначения');
      setLoading(false);
      return;
    }

    if (documentData.document_type === 'outgoing' && !documentData.source_warehouse) {
      setError('Для расходного документа обязателен склад-источник');
      setLoading(false);
      return;
    }

    if (documentData.document_type === 'transfer' && (!documentData.source_warehouse || !documentData.destination_warehouse)) {
      setError('Для перемещения обязательны оба склада');
      setLoading(false);
      return;
    }

    const documentToSave = {
      document_type: documentData.document_type,
      partner: documentData.partner || '',
      source_warehouse: documentData.source_warehouse || null,
      destination_warehouse: documentData.destination_warehouse || null,
      currency: documentData.currency,
      notes: documentData.notes || '',
      status: 'draft', // Всегда создаем как черновик
      items: documentData.items.map(item => ({
        product: parseInt(item.product),
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        total_cost: parseFloat(item.total_cost) || 0,
        batch_number: item.batch_number || '',
        expiration_date: item.expiration_date || null,
        notes: item.notes || ''
      }))
    };

    const result = await documentService.createDocument(documentToSave);
    
    
    const documentId = result.id;
    const documentNumber = result.document_number;

    if (documentId) {
      if (status === 'completed') {
        
        try {
          await documentService.changeDocumentStatus(documentId, 'completed');
          try {
            await documentService.completeDocument(documentId);
            setSuccessMessage(`Документ №${documentNumber} создан и завершен`);
          } catch (completeError) {
            setSuccessMessage(`Документ №${documentNumber} создан и переведен в статус "Завершен"`);
          }
          
        } catch (statusError) {
          setSuccessMessage(`Документ №${documentNumber} создан, но не удалось завершить`);
        }
      } else {
        setSuccessMessage(`Черновик №${documentNumber} сохранен`);
      }
      
      setTimeout(() => {
        setDocumentData({
          document_type: 'incoming',
          partner: '',
          source_warehouse: '',
          destination_warehouse: '',
          currency: 'RUB',
          notes: '',
          items: []
        });
        
        navigate(`/documents/${documentId}/edit`);
      }, 2000);
      
    } else {
      console.error('❌ [PAGE] ID документа не найден');
      setError('Не удалось получить ID созданного документа');
    }
    
  } catch (err) {
    console.error('❌ [PAGE] Ошибка сохранения документа:', err);
    setError(err.message || 'Ошибка при сохранении документа');
  } finally {
    setLoading(false);
  }
};

  const totalProducts = documentData.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = documentData.items.reduce((sum, item) => sum + (item.total_cost || 0), 0);

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

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={3000} 
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Заголовок */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Создание документа</h1>
          <div className="flex gap-2">
            <Button 
              bgColor="#407E41"
              onClick={() => handleSaveDocument('completed')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg"
            >
              {loading ? <CircularProgress size={20} /> : <SaveIcon />}
              Сохранить документ
            </Button>
            <Button 
              bgColor="#7E6341"
              onClick={() => handleSaveDocument('draft')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg"
            >
              <EditNoteIcon />
              Сохранить черновик
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Левая панель - информация о документе */}
        <div className="flex flex-col w-1/3 shrink-0">
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Информация о документе</h2>
            
            <div className="space-y-4">
              {/* Тип документа */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип документа *
                </label>
                <SelectFilter
                  value={documentData.document_type}
                  onChange={(value) => updateDocumentField('document_type', value)}
                  options={[
                    { value: 'incoming', label: 'Поступление' },
                    { value: 'outgoing', label: 'Списание' },
                    { value: 'inventory', label: 'Инвентаризация' },
                    { value: 'return', label: 'Возврат' },
                    { value: 'transfer', label: 'Перемещение' },
                  ]}
                />
              </div>

              {/* Партнер - исправленное поле */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Партнер
                </label>
                <input
                  type="text"
                  value={documentData.partner}
                  onChange={(e) => handlePartnerChange(e.target.value)}
                  placeholder="Введите название партнера"
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              {/* Склады в зависимости от типа документа */}
              {documentData.document_type === 'incoming' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Склад назначения *
                  </label>
                  <SelectFilter
                    value={documentData.destination_warehouse}
                    onChange={(value) => updateDocumentField('destination_warehouse', value)}
                    options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                    placeholder="Выберите склад"
                  />
                </div>
              )}

              {documentData.document_type === 'outgoing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Склад-источник *
                  </label>
                  <SelectFilter
                    value={documentData.source_warehouse}
                    onChange={(value) => updateDocumentField('source_warehouse', value)}
                    options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                    placeholder="Выберите склад"
                  />
                </div>
              )}

              {documentData.document_type === 'transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Склад-источник *
                    </label>
                    <SelectFilter
                      value={documentData.source_warehouse}
                      onChange={(value) => updateDocumentField('source_warehouse', value)}
                      options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                      placeholder="Выберите склад"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Склад назначения *
                    </label>
                    <SelectFilter
                      value={documentData.destination_warehouse}
                      onChange={(value) => updateDocumentField('destination_warehouse', value)}
                      options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                      placeholder="Выберите склад"
                    />
                  </div>
                </>
              )}

              {/* Валюта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Валюта
                </label>
                <SelectFilter
                  value={documentData.currency}
                  onChange={(value) => updateDocumentField('currency', value)}
                  options={[
                    { value: 'RUB', label: 'Рубль (RUB)' },
                    { value: 'USD', label: 'Доллар (USD)' },
                    { value: 'EUR', label: 'Евро (EUR)' },
                    { value: 'CNY', label: 'Юань (CNY)' },
                  ]}
                />
              </div>

              {/* Примечания */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Примечания
                </label>
                <textarea
                  value={documentData.notes}
                  onChange={(e) => updateDocumentField('notes', e.target.value)}
                  placeholder="Введите примечания к документу"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900"
                  rows={3}
                />
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
                  <span className="font-semibold text-gray-900">{totalCost.toLocaleString('ru-RU')} {documentData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Количество позиций:</span>
                  <span className="font-semibold text-gray-900">{documentData.items.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая панель - товары */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            {/* Заголовок с кнопками */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Button
                  bgColor="#407E41"
                  onClick={() => setIsProductModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                >
                  <AddIcon/>
                  Добавить товар
                </Button>
                <Button
                  bgColor="#F44141"
                  onClick={() => {
                    if (documentData.items.length > 0 && window.confirm('Очистить все товары из документа?')) {
                      setDocumentData(prev => ({ ...prev, items: [] }));
                    }
                  }}
                  disabled={documentData.items.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                >
                  <DeleteIcon/>
                  Очистить все
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Позиций: <span className="font-semibold text-gray-900">{documentData.items.length}</span>
              </div>
            </header>

            {/* Список товаров */}
            <div className="p-4">
              {documentData.items.length > 0 ? (
                <div className="space-y-3">
                  {documentData.items.map((item, index) => {
                    const product = availableProducts.find(p => p.id === item.product);
                    return (
                      <div key={item.product} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white">
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
                              Количество *
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.product, e.target.value)}
                              className="w-20 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                              min="1"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Цена *
                            </label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handlePriceChange(item.product, e.target.value)}
                              className="w-24 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                        
                        {/* Итог и действия */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Стоимость</div>
                            <div className="font-semibold text-gray-900">
                              {(item.total_cost || 0).toLocaleString('ru-RU')} {documentData.currency}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteProduct(item.product)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center justify-center"
                            title="Удалить товар"
                          >
                            <DeleteIcon fontSize="small" className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-lg font-medium text-gray-700 mb-2">Нет товаров в документе</div>
                  <div className="text-sm text-gray-600">Нажмите "Добавить товар" чтобы начать работу</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно выбора товаров */}
      {isProductModalOpen && (
        <ProductSelectionModal
          onClose={() => setIsProductModalOpen(false)}
          availableProducts={availableProducts}
          onProductSelected={addSelectedProduct}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}
    </MainLayout>
  );
};

export default DocumentCreatePage;