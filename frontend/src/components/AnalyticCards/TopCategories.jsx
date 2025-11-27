import React, { useState, useEffect } from 'react';
import AnalyticBlock from '../AnalyticBlock';
import DataTable from '../Table/DataTable';
import { topCategoriesTableColumn } from '../../data/tableSettings';
import { analyticsApi } from '../../services/analyticsApi';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const TopCategories = () => {
  const [categoriesData, setCategoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTopCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyticsApi.getTopCategories();
        setCategoriesData(data);
      } catch (err) {
        setError('Не удалось загрузить данные о категориях');
        setCategoriesData([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopCategories();
  }, []);

  const tableData = categoriesData.map(category => ({
    ...category,
    sales: category.sales?.toString() || '0'
  }));

  if (loading) {
    return (
      <AnalyticBlock
        title="Топ категорий"
        subtitle="За месяц"
      >
        <div className="flex items-center justify-center h-48">
          <CircularProgress sx={{ color: '#FEB95A' }} />
        </div>
      </AnalyticBlock>
    );
  }

  if (error) {
    return (
      <AnalyticBlock
        title="Топ категорий"
        subtitle="За месяц"
      >
        <div className="flex items-center justify-center h-48">
          <Alert severity="error" className="w-full">
            {error}
          </Alert>
        </div>
      </AnalyticBlock>
    );
  }

  return (
    <AnalyticBlock
      title="Топ категорий"
      subtitle="За месяц"
    >
      {categoriesData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-white/60">
          Нет данных о категориях за текущий месяц
        </div>
      ) : (
        <DataTable 
          data={tableData}
          column={topCategoriesTableColumn}
          hasPagination={false}
          hasBorder={false}
          maxItemsPerPage={5}
        />
      )}
    </AnalyticBlock>
  );
};

export default TopCategories;