// hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { productApi } from '../services/productApi';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    country: '',
    direction: '',
    is_active: '',
    date_from: '',
    date_to: ''
  });

  const loadProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.getProducts({ ...filters, page });
      
      setProducts(data.results);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: page
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      country: '',
      direction: '',
      is_active: '',
      date_from: '',
      date_to: ''
    });
  };

  const transformProductData = (product) => ({
        ...product,
        marketplaces: product.marketplace_products || []
    });

  const setPage = (page) => loadProducts(page);

  return {
    products,
    loading,
    error,
    pagination,
    filters,
    loadProducts,
    updateFilters,
    resetFilters,
    setPage,
    transformProductData
  };
};