// ProductsPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import MainLayout from '../Layout/MainLayout';
import DataTable from '../Table/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useFilterOptions } from '../../hooks/useFilterOptions'; // Новый хук
import { productTableColumn } from '../../data/tableSettings';

const ProductsPage = () => {
  const navigate = useNavigate();
  const {
    products,
    loading: productsLoading,
    error: productsError,
    pagination,
    filters,
    updateFilters,
    resetFilters,
    setPage
  } = useProducts();

  const {
    categories,
    loading: categoriesLoading
  } = useCategories();

  const {
    filterOptions,
    loading: filtersLoading,
    error: filtersError
  } = useFilterOptions();

  const { countries, directions } = filterOptions;

  const [localFilters, setLocalFilters] = useState({
    search: '',
    category: '',
    country: '',
    direction: '',
    is_active: '',
    date_from: '',
    date_to: ''
  });

  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (isInitialMount.current) {
      setLocalFilters({
        search: filters.search || '',
        category: filters.category || '',
        country: filters.country || '',
        direction: filters.direction || '',
        is_active: filters.is_active || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || ''
      });
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const cleanedFilters = Object.fromEntries(
        Object.entries(localFilters).filter(([_, value]) => value !== '')
      );

      const currentCleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      if (JSON.stringify(cleanedFilters) !== JSON.stringify(currentCleanedFilters)) {
        updateFilters({ ...cleanedFilters, page: 1 });
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localFilters]);

  const handleFilterChange = (filterName, value) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      [filterName]: value 
    }));
  };

  const handleClearSearch = () => {
    setLocalFilters(prev => ({ ...prev, search: '' }));
  };

  const handleResetFilters = () => {
    const resetState = {
      search: '',
      category: '',
      country: '',
      direction: '',
      is_active: '',
      date_from: '',
      date_to: ''
    };
    setLocalFilters(resetState);
  };

  const tableData = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      main_img: product.main_img?.startsWith('http') 
        ? product.main_img 
        : `http://127.0.0.1:8000${product.main_img}`,
      article: product.article,
      category: product.category_name || 'Без категории',
      country: product.country_display,
      direction: product.direction_display,
      is_active: product.is_active,
      marketplaces: product.marketplace_products || [],
      created_at: new Date(product.created_at).toLocaleDateString('ru-RU'),
    }));
  }, [products]);

  const handlePageChange = (pageUrl) => {
    if (pageUrl) {
      const url = new URL(pageUrl);
      const page = url.searchParams.get('page');
      setPage(page);
    }
  };

  const columnsWithEdit = useMemo(() => [
    ...productTableColumn,
    {
      key: "edit",
      title: "Действия",
      cellClassName: "w-20 min-w-20",
      render: (_, row) => (
        <button
          type="button"
          onClick={() => navigate(`/products/edit/${row.id}`)}
          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:scale-105 px-3 py-1 transition-transform duration-200"
          title="Редактировать"
        >
          <EditIcon />
        </button>
      ) 
    }
  ], [navigate]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(localFilters).some(value => value !== '');
  }, [localFilters]);

  const isLoading = productsLoading || categoriesLoading || filtersLoading;

  if (isLoading && products.length === 0) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Загрузка данных...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Товары</h1>
        <button
          type="button"
          onClick={() => navigate('/products/create')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          + Добавить товар
        </button>
      </div>

      {/* Форма фильтрации */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Поиск */}
          <div className="lg:col-span-2 relative">
            <label className="block text-sm text-gray-300 mb-1">
              Поиск по названию или артикулу
            </label>
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Введите название или артикул..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 pr-10 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            />
            {localFilters.search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-9 text-gray-400 hover:text-white text-xl font-bold transition-colors duration-200"
                title="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Категория</label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Страна */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Страна</label>
            <select
              value={localFilters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
            >
              <option value="">Все страны</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Направление */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Направление</label>
            <select
              value={localFilters.direction}
              onChange={(e) => handleFilterChange('direction', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
            >
              <option value="">Все направления</option>
              {directions.map(dir => (
                <option key={dir.id} value={dir.id}>
                  {dir.name}
                </option>
              ))}
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Статус</label>
            <select
              value={localFilters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
            >
              <option value="">Все статусы</option>
              <option value="true">Активный</option>
              <option value="false">Неактивный</option>
            </select>
          </div>

          {/* Дата от */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Дата создания от</label>
            <input
              type="date"
              value={localFilters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
            />
          </div>

          {/* Дата до */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Дата создания до</label>
            <input
              type="date"
              value={localFilters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
            />
          </div>

          {/* Кнопка сброса */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className={`px-4 py-2 rounded w-full transition-colors duration-200 ${
                hasActiveFilters
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        {/* Индикатор активных фильтров */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="text-sm text-blue-300">
              Активные фильтры: {Object.entries(localFilters)
                .filter(([_, value]) => value !== '')
                .map(([key, value]) => {
                  let displayValue = value;
                  if (key === 'is_active') {
                    displayValue = value === 'true' ? 'Активный' : 'Неактивный';
                  } else if (key === 'category') {
                    const category = categories.find(cat => cat.id.toString() === value);
                    displayValue = category?.name || value;
                  } else if (key === 'country') {
                    const country = countries.find(c => c.id.toString() === value);
                    displayValue = country?.name || value;
                  } else if (key === 'direction') {
                    const direction = directions.find(d => d.id.toString() === value);
                    displayValue = direction?.name || value;
                  }
                  return `${key}: ${displayValue}`;
                })
                .join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Состояние загрузки/ошибки */}
      {(productsError || filtersError) ? (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <div className="text-red-200 mb-2">
            Ошибка загрузки данных: {productsError || filtersError}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white transition-colors duration-200"
          >
            Обновить страницу
          </button>
        </div>
      ) : (
        <>
          {/* Информация о результатах */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-gray-300">
              {productsLoading ? (
                'Загрузка...'
              ) : (
                `Найдено товаров: ${pagination.count || products.length}`
              )}
            </div>
            {productsLoading && (
              <div className="text-blue-400 text-sm">
                Обновление данных...
              </div>
            )}
          </div>

          {/* Таблица */}
          <DataTable
            data={tableData}
            column={columnsWithEdit}
            theadColor="gray-800"
            pagination={{
              count: pagination.count,
              next: pagination.next,
              previous: pagination.previous,
              currentPage: pagination.currentPage
            }}
            onPageChange={handlePageChange}
            isLoading={productsLoading}
          />
        </>
      )}

      {/* Сообщение если нет товаров */}
      {!productsLoading && products.length === 0 && !productsError && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {hasActiveFilters 
              ? 'Товары по заданным фильтрам не найдены' 
              : 'Товары не найдены'
            }
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default ProductsPage;