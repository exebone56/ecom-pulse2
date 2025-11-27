import { useState, useEffect } from 'react';
import { productApi } from '../services/productApi';

export const useFilterOptions = () => {
  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    directions: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productApi.getFilters();
        setFilterOptions(data);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError(err.message || 'Не удалось загрузить опции фильтров');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return {
    filterOptions,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
    }
  };
};