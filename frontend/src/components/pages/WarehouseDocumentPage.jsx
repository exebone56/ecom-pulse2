// pages/DocumentsPage.jsx
import { useState, useEffect } from 'react';
import { documentService } from '../../services/documentServices';
import MainLayout from '../Layout/MainLayout';
import DataTable from '../Table/DataTable';
import Button from '../UI/Buttons/Button';
import Input from '../UI/Buttons/Input';
import SelectFilter from '../UI/SelectFilter';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';

const WarehouseDocumentPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    document_type: '',
    status: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const documentColumns = [
    {
      key: "document_number",
      title: "Номер документа",
      cellClassName: "font-medium text-gray-900"
    },
    {
      key: "document_type",
      title: "Тип документа",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'incoming' ? 'bg-green-100 text-green-800' :
          value === 'outgoing' ? 'bg-red-100 text-red-800' :
          value === 'inventory' ? 'bg-blue-100 text-blue-800' :
          value === 'return' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getDocumentTypeLabel(value)}
        </span>
      )
    },
    {
      key: "status",
      title: "Статус",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'draft' ? 'bg-gray-100 text-gray-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {getStatusLabel(value)}
        </span>
      )
    },
    {
      key: "partner",
      title: "Партнер",
      render: (value) => value || '—',
      cellClassName: "text-gray-700"
    },
    {
      key: "destination_warehouse_name",
      title: "Склад",
      render: (value, row) => (
        <div>
          {row.document_type === 'incoming' && row.destination_warehouse_name && (
            <div className="text-sm">📥 {row.destination_warehouse_name}</div>
          )}
          {row.document_type === 'outgoing' && row.source_warehouse_name && (
            <div className="text-sm">📤 {row.source_warehouse_name}</div>
          )}
          {row.document_type === 'transfer' && (
            <div className="text-xs">
              <div>📤 {row.source_warehouse_name}</div>
              <div>📥 {row.destination_warehouse_name}</div>
            </div>
          )}
          {!value && '—'}
        </div>
      )
    },
    {
      key: "total_products",
      title: "Товаров",
      render: (value) => (
        <span className="font-medium">{value} шт.</span>
      )
    },
    {
      key: "total_cost",
      title: "Стоимость",
      render: (value, row) => (
        <span className="font-medium">
          {parseFloat(value || 0).toLocaleString('ru-RU')} {row.currency || '₽'}
        </span>
      )
    },
    {
      key: "created_by_info",
      title: "Создатель",
      render: (value) => (
        <div className="text-sm">
          {value?.first_name && value?.last_name 
            ? `${value.first_name} ${value.last_name}`
            : value?.username || '—'
          }
        </div>
      )
    },
    {
      key: "created_at",
      title: "Дата создания",
      render: (value) => new Date(value).toLocaleDateString('ru-RU'),
      cellClassName: "text-gray-700"
    },
    {
      key: "actions",
      title: "Действия",
      render: (value, row) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleViewDocument(row.id)}
            className="p-1 min-w-[40px] h-8 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
            title="Просмотр"
          >
            <VisibilityIcon fontSize="small" className="text-blue-600" />
          </button>
          {row.status === 'draft' && (
            <Button
              bgColor="#f59e0b"
              onClick={() => handleEditDocument(row.id)}
              className="p-1 min-w-[40px] h-8 rounded-lg"
              title="Редактировать"
            >
              <EditIcon fontSize="small" />
            </Button>
          )}
          {row.status === 'draft' && (
            <Button
              bgColor="#ef4444"
              onClick={() => handleDeleteDocument(row.id)}
              className="p-1 min-w-[40px] h-8 rounded-lg"
              title="Удалить"
            >
              <DeleteIcon fontSize="small" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filters.document_type) params.document_type = filters.document_type;
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      
      const data = await documentService.getDocuments(params);
      setDocuments(data.results || data);
      setError(null);
      
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке документов');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    loadDocuments();
  };

  const handleClearFilters = () => {
    setFilters({
      document_type: '',
      status: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
    loadDocuments();
  };

  const handleViewDocument = (documentId) => {
    navigate(`/warehouse/documents/${documentId}`);
  };

  const handleEditDocument = (documentId) => {
    navigate(`/warehouse/documents/${documentId}/edit`);
  };

  const handleCreateDocument = () => {
    navigate('/warehouse/documents/create');
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот документ?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      setSuccessMessage('Документ успешно удален');
      loadDocuments(); // Перезагружаем список
    } catch (err) {
      setError(err.message || 'Ошибка при удалении документа');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleSearchChange = (value) => {
    const searchValue = typeof value === 'string' ? value : 
                       value?.target?.value || '';
    setSearchTerm(searchValue);
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

  const totalDocuments = documents.length;
  const completedDocuments = documents.filter(d => d.status === 'completed').length;
  const draftDocuments = documents.filter(d => d.status === 'draft').length;

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

      {/* Заголовок и кнопки */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Документы складского учета</h1>
          <Button
            bgColor="#407E41"
            onClick={handleCreateDocument}
            className="flex items-center gap-2 px-6 py-3 text-base min-w-[200px] justify-center rounded-lg"
          >
            <AddIcon />
            Создать документ
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{totalDocuments}</div>
            <div className="text-sm text-gray-700">Всего документов</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-700">{completedDocuments}</div>
            <div className="text-sm text-gray-700">Завершено</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-700">{draftDocuments}</div>
            <div className="text-sm text-gray-700">Черновики</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-700">
              {documents.filter(d => d.document_type === 'incoming').length}
            </div>
            <div className="text-sm text-gray-700">Поступлений</div>
          </div>
        </div>
      </div>

      {/* Панель поиска и фильтров */}
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          {/* Поиск */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                placeholder="Поиск по номеру документа, партнеру..."
                className="pl-10 pr-4 w-full bg-white text-gray-900 placeholder-gray-500 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-2">
            <Button
              bgColor="#6b7280"
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 min-w-[120px] justify-center rounded-lg"
              type="submit"
            >
              <SearchIcon />
              Поиск
            </Button>
            
            <Button
              bgColor="#8b5cf6"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 min-w-[120px] justify-center rounded-lg"
            >
              <FilterListIcon />
              Фильтры
            </Button>

            <Button
              bgColor="#10b981"
              onClick={() => {/* TODO: реализовать экспорт */}}
              className="flex items-center gap-2 px-4 py-2 min-w-[120px] justify-center rounded-lg"
            >
              <DownloadIcon />
              Экспорт
            </Button>
          </div>
        </form>

        {/* Расширенные фильтры */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип документа
                </label>
                <SelectFilter
                  value={filters.document_type}
                  onChange={(value) => setFilters(prev => ({ ...prev, document_type: value }))}
                  options={[
                    { value: '', label: 'Все типы' },
                    { value: 'incoming', label: 'Поступление' },
                    { value: 'outgoing', label: 'Списание' },
                    { value: 'inventory', label: 'Инвентаризация' },
                    { value: 'return', label: 'Возврат' },
                    { value: 'transfer', label: 'Перемещение' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <SelectFilter
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  options={[
                    { value: '', label: 'Все статусы' },
                    { value: 'draft', label: 'Черновик' },
                    { value: 'pending', label: 'На согласовании' },
                    { value: 'completed', label: 'Завершен' },
                    { value: 'cancelled', label: 'Отменен' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата с
                </label>
                <div className="bg-[#2A2A30] rounded-lg">
                  <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(value) => setFilters(prev => ({ ...prev, date_from: value }))}
                  className="bg-transparent text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
                />
                </div>
                
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата по
                </label>
                <div className="bg-[#2A2A30] rounded-lg">
                  <Input
                    type="date"
                    value={filters.date_to}
                    onChange={(value) => setFilters(prev => ({ ...prev, date_to: value }))}
                    className="bg-transparent text-gray-900 rounded-lg cursor-pointer"
                  />
                </div>
                
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                bgColor="#6b7280"
                onClick={handleClearFilters}
                className="px-4 py-2 min-w-[100px] rounded-lg"
              >
                Очистить
              </Button>
              <Button
                bgColor="#3b82f6"
                onClick={handleSearch}
                className="px-4 py-2 min-w-[140px] rounded-lg"
              >
                Применить фильтры
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Таблица документов */}
      <div className="">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <CircularProgress />
          </div>
        ) : (
          <>
            <DataTable
              column={documentColumns}
              data={documents}
              theadColor="gray-800"
              loading={false}
              pagination={documents.pagination}
              onPageChange={(pageUrl) => {
                // TODO: реализовать пагинацию
                console.log('Page change:', pageUrl);
              }}
              tableClassName="bg-gray-50"
              headerClassName="bg-gray-800 text-white"
            />

            {documents.length === 0 && (
              <div className="text-center py-12 bg-white">
                <div className="text-6xl mb-4">📄</div>
                <div className="text-lg font-medium text-gray-700 mb-2">Документы не найдены</div>
                <div className="text-sm text-gray-600 mb-4">
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? 'Попробуйте изменить параметры поиска' 
                    : 'Создайте первый документ складского учета'
                  }
                </div>
                {(searchTerm || Object.values(filters).some(f => f)) ? (
                  <Button
                    bgColor="#3b82f6"
                    onClick={handleClearFilters}
                    className="px-6 py-2 rounded-lg"
                  >
                    Очистить фильтры
                  </Button>
                ) : (
                  <Button
                    bgColor="#407E41"
                    onClick={handleCreateDocument}
                    className="flex items-center gap-2 px-6 py-3 mx-auto rounded-lg"
                  >
                    <AddIcon />
                    Создать первый документ
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default WarehouseDocumentPage;