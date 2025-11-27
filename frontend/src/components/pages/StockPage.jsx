import { useState, useEffect, useRef } from 'react';
import { stockService } from '../../services/stockService';
import { stockProductTableColumn } from '../../data/tableSettings';
import MainLayout from '../Layout/MainLayout';
import DataTable from '../Table/DataTable';
import Button from '../UI/Buttons/Button';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';

const StockPage = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [savingIds, setSavingIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async (searchArticle = '', pageUrl = null) => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchArticle) {
        params.article = searchArticle;
      }
      
      let data;
      if (pageUrl) {
        data = await stockService.getStocksByUrl(pageUrl);
      } else {
        data = await stockService.getStocks(params);
      }
      
      let stocksArray = [];
      let paginationInfo = {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1
      };
      
      if (data.results) {
        stocksArray = data.results;
        paginationInfo = {
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          currentPage: getCurrentPageFromUrl(data.next || data.previous)
        };
      } else if (Array.isArray(data)) {
        stocksArray = data;
        paginationInfo = {
          count: data.length,
          next: null,
          previous: null,
          currentPage: 1
        };
      }
      
      setStockData(transformStockData(stocksArray));
      setPagination(paginationInfo);
      setError(null);
      
      if (searchArticle && !pageUrl) {
        setSuccessMessage(`Найдено ${paginationInfo.count} записей по артикулу "${searchArticle}"`);
      }
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке данных об остатках');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const getCurrentPageFromUrl = (url) => {
    if (!url) return 1;
    const urlParams = new URLSearchParams(new URL(url).search);
    return parseInt(urlParams.get('page')) || 1;
  };

  // Обработчик смены страницы
  const handlePageChange = (pageUrl) => {
    if (pageUrl) {
      loadStockData(searchTerm, pageUrl);
    }
  };

  const transformStockData = (apiData) => {
    return apiData.map(stock => ({
      id: stock.id,
      img: stock.product_info?.images?.[0] || stock.product?.images?.[0] || '',
      article: stock.product_info?.article || stock.product?.article || 'N/A',
      availableCount: stock.actual_available || stock.available_quantity || 0,
      reservedAll: stock.total_reserved || 0,
      reservedByOzon: stock.reserved_ozon || 0,
      reservedByWb: stock.reserved_wb || 0,
      reservedByYandex: stock.reserved_yandex || 0,
      isLowStock: stock.is_low_stock || false,
      originalAvailableCount: stock.actual_available || stock.available_quantity || 0,
    }));
  };

  // Обработчик поиска
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      loadStockData(searchTerm.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(true);
    loadStockData();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Автосохранение при изменении значения
  const handleCellUpdate = async (rowId, field, newValue) => {
    
    if (field !== 'availableCount') return;

    try {
      if (isNaN(newValue) || newValue < 0) {
        setError('Введите корректное число (≥ 0)');
        return;
      }

      const quantity = parseInt(newValue);
      
      const row = stockData.find(item => item.id === rowId);
      if (!row) {
        setError('Запись не найдена');
        return;
      }

      if (row.originalAvailableCount === quantity) {
        return;
      }

      setSavingIds(prev => new Set(prev).add(rowId));

      await stockService.updateStock(rowId, quantity);
      
      setStockData(prev => prev.map(item => 
        item.id === rowId 
          ? { 
              ...item, 
              availableCount: quantity,
              originalAvailableCount: quantity
            }
          : item
      ));
      
      setSuccessMessage(`Количество для артикула ${row.article} успешно обновлено`);
      
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении количества');

      setStockData(prev => prev.map(item => 
        item.id === rowId 
          ? { ...item, availableCount: item.originalAvailableCount }
          : item
      ));
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    }
  };

  const handleSaveAll = async () => {
    try {
      const changedRecords = stockData.filter(item => 
        item.availableCount !== item.originalAvailableCount
      );

      if (changedRecords.length === 0) {
        setSuccessMessage('Нет изменений для сохранения');
        return;
      }

      setLoading(true);
      
      const savePromises = changedRecords.map(record =>
        stockService.updateStock(record.id, record.availableCount)
      );

      await Promise.all(savePromises);
      
      setStockData(prev => prev.map(item => ({
        ...item,
        originalAvailableCount: item.availableCount
      })));
      
      setSuccessMessage(`Успешно сохранено ${changedRecords.length} записей`);
      
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении изменений');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      setError('Поддерживаются только CSV и Excel файлы');
      return;
    }

    try {
      setFileUploading(true);
      const result = await stockService.bulkUpdate(file);
      
      let message = `Успешно обновлено ${result.success} записей`;
      if (result.errors && result.errors.length > 0) {
        message += `. Ошибки: ${result.errors.slice(0, 5).join(', ')}`;
        if (result.errors.length > 5) {
          message += `... и еще ${result.errors.length - 5} ошибок`;
        }
        setError(message);
      } else {
        setSuccessMessage(message);
      }
      
      await loadStockData(searchTerm);
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке файла');
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await stockService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      if (blob.type.includes('sheet')) {
        link.download = 'stock_template.xlsx';
      } else {
        link.download = 'stock_template.csv';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Шаблон успешно скачан');
    } catch (err) {
      setError(err.message || 'Ошибка при скачивании шаблона');
      console.error('Error downloading template:', err);
    }
  };

  const handleShowLowStock = async () => {
    try {
      setLoading(true);
      const data = await stockService.getLowStock();
      
      let lowStockArray = [];
      let paginationInfo = {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1
      };
      
      if (data.results) {
        lowStockArray = data.results;
        paginationInfo = {
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          currentPage: getCurrentPageFromUrl(data.next || data.previous)
        };
      } else if (Array.isArray(data)) {
        lowStockArray = data;
        paginationInfo = {
          count: data.length,
          next: null,
          previous: null,
          currentPage: 1
        };
      }
      
      setStockData(transformStockData(lowStockArray));
      setPagination(paginationInfo);
      setSearchTerm('');
      setSuccessMessage(`Показаны товары с низким остатком (${paginationInfo.count} записей)`);
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке товаров с низким остатком');
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllStocks = async () => {
    setSearchTerm('');
    await loadStockData();
    setSuccessMessage('Показаны все товары');
  };

  const getChangedRecordsCount = () => {
    return stockData.filter(item => 
      item.availableCount !== item.originalAvailableCount
    ).length;
  };

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

      {/* Панель управления */}
      <div className="bg-transparent rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Управление остатками</h2>
        
        {/* Поиск по артикулу */}
        <div className="mb-4">
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по артикулу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
            <Button 
              bgColor="#6b7280"
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="flex items-center gap-2 px-4 py-2 text-base font-medium"
            >
              {isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
              Поиск
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Основные действия */}
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              bgColor="#3b82f6"
              onClick={handleShowAllStocks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-base font-medium"
            >
              {loading ? <CircularProgress size={20} /> : <ArrowCircleDownIcon />}
              Все остатки
            </Button>

            <Button 
              bgColor="#f59e0b"
              onClick={handleShowLowStock}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-base font-medium"
            >
              <WarningIcon />
              Низкие остатки
            </Button>

            {/* Кнопка сохранения всех изменений */}
            {getChangedRecordsCount() > 0 && (
              <Button 
                bgColor="#10b981"
                onClick={handleSaveAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 text-base font-medium"
              >
                <SaveIcon />
                Сохранить все ({getChangedRecordsCount()})
              </Button>
            )}
          </div>

          {/* Работа с файлами */}
          <div className="flex flex-wrap items-center gap-3 border-l border-gray-300 pl-3 ml-3">
            <Button 
              bgColor="#6366f1"
              onClick={handleDownloadTemplate}
              disabled={fileUploading}
              className="flex items-center gap-2 px-4 py-2.5 text-base font-medium"
            >
              <DownloadIcon />
              Скачать шаблон
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={fileUploading}
            />
            
            <Button 
              bgColor="#8b5cf6"
              onClick={handleUploadButtonClick}
              disabled={fileUploading}
              className="flex items-center gap-2 px-4 py-2.5 text-base font-medium"
            >
              {fileUploading ? <CircularProgress size={20} /> : <FileUploadIcon />}
              {fileUploading ? 'Загрузка...' : 'Загрузить файл'}
            </Button>
          </div>

          {/* Статистика */}
          <div className="flex flex-wrap items-center gap-4 border-l border-gray-300 pl-3 ml-3">
            <span className="text-sm text-gray-600">
              Всего записей: <span className="font-semibold text-gray-800">{pagination.count}</span>
            </span>
            <span className="text-sm text-gray-600">
              На странице: <span className="font-semibold text-gray-800">{stockData.length}</span>
            </span>
            <span className="text-sm text-gray-600">
              Страница: <span className="font-semibold text-gray-800">{pagination.currentPage}</span>
            </span>
            <span className="text-sm text-gray-600">
              Низких остатков: <span className="font-semibold text-red-600">
                {stockData.filter(item => item.isLowStock).length}
              </span>
            </span>
            {getChangedRecordsCount() > 0 && (
              <span className="text-sm text-yellow-600 font-semibold">
                Несохраненных: {getChangedRecordsCount()}
              </span>
            )}
            {searchTerm && (
              <span className="text-sm text-blue-600 font-semibold">
                Поиск: "{searchTerm}"
              </span>
            )}
          </div>
        </div>

        {/* Подсказка по файлу */}
        <div className="mt-3 text-xs text-gray-500">
          📁 Поддерживаемые форматы: CSV, Excel (.xlsx, .xls) | Обязательные колонки: article, available_quantity
          {getChangedRecordsCount() > 0 && (
            <span className="ml-2 text-yellow-600">
              💡 Изменения сохраняются автоматически при редактировании
            </span>
          )}
        </div>
      </div>

      {/* Таблица с пагинацией */}
      <div className="bg-transparent rounded-lg">
        <DataTable
          column={stockProductTableColumn}
          data={stockData}
          loading={loading}
          onCellUpdate={handleCellUpdate}
          pagination={pagination}
          onPageChange={handlePageChange}
          rowClassName={(row) => {
            let className = '';
            if (row.isLowStock) className += 'border-l-4 border-l-red-500 ';
            if (savingIds.has(row.id)) className += 'bg-blue-50 ';
            if (row.availableCount !== row.originalAvailableCount) className += 'bg-yellow-50 ';
            return className.trim();
          }}
          cellClassName={(row, column) => {
            if (column.key === 'availableCount' && savingIds.has(row.id)) {
              return 'relative';
            }
            return '';
          }}
          renderCell={(value, row, column) => {
            if (column.key === 'availableCount' && savingIds.has(row.id)) {
              return (
                <div className="flex items-center gap-2">
                  <CircularProgress size={16} />
                  <span>{value}</span>
                </div>
              );
            }
            return value;
          }}
        />
      </div>
    </MainLayout>
  );
};

export default StockPage;