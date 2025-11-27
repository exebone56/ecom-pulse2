import React, { useState, useEffect, useCallback } from 'react';
import AnalyticBlock from '../AnalyticBlock';
import DataTable from '../Table/DataTable';
import { lowStockTableColumns } from '../../data/tableSettings';
import { analyticsApi } from '../../services/analyticsApi';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import WarningIcon from '@mui/icons-material/Warning';

const LowInventory = () => {
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const loadLowStockProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getLowStockProducts(page);
      
      setProductsData(response.results || []);
      
      setPagination(prev => ({
        count: response.count || 0,
        currentPage: page,
        next: response.next ? page + 1 : null,
        previous: response.previous ? page - 1 : null,
        totalPages: Math.ceil((response.count || 0) / 5)
      }));
    } catch (err) {
      setError('Не удалось загрузить данные о товарах с низким остатком');
      setProductsData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page) => {
    if (pagination?.currentPage !== page) {
      loadLowStockProducts(page);
    }
  }, [pagination?.currentPage, loadLowStockProducts]);

  useEffect(() => {
    loadLowStockProducts(1);
  }, [loadLowStockProducts]);

  const tableData = React.useMemo(() => productsData, [productsData]);

  return (
    <AnalyticBlock
      title={
        <div className="flex items-center gap-2">
          <WarningIcon sx={{ color: '#F59E0B', fontSize: 24 }} />
          Низкий остаток товара
        </div>
      }
      subtitle={`Товары с остатком ≤ 5 шт.${pagination ? ` (Всего: ${pagination.count})` : ''}`}
    >
      {loading && productsData.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <CircularProgress sx={{ color: '#FEB95A' }} />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48">
          <Alert severity="error" className="w-full">
            {error}
          </Alert>
        </div>
      ) : (
        <DataTable 
          data={tableData}
          column={lowStockTableColumns}
          hasBorder={true}
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loading}
          maxItemsPerPage={5}
        />
      )}
    </AnalyticBlock>
  );
};

export default React.memo(LowInventory); // Memo для предотвращения лишних рендеров