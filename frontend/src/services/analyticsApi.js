import apiClient from './apiClient';

export const analyticsApi = {
  async getRevenueStats() {
    try {
      const response = await apiClient.get('revenue-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  },
  async getRevenueChartData(marketplaceIds = ['all']) {
    try {
      const idsParam = marketplaceIds.join(',');
      const response = await apiClient.get(`/revenue-chart/?marketplaces=${idsParam}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue chart data:', error);
      throw error;
    }
  },
  async getRevenueDailyData(marketplaceId = 'all') {
    try {
      const response = await apiClient.get(`/revenue-daily/?marketplaces=${marketplaceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily revenue data:', error);
      throw error;
    }
  },
  async getDailyStats() {
    try {
      const response = await apiClient.get('/daily-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw error;
    }
  },
  async getTopCategories() {
    try {
      const response = await apiClient.get('/top-categories/');
      return response.data;
    } catch (error) {
      console.error('Error fetching top categories:', error);
      throw error;
    }
  },
  async getLowStockProducts(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(`/low-stock-products/?page=${page}&page_size=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  }
};