// services/stockService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const handleAxiosError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const errorData = error.response.data;
    
    let errorMessage = `Ошибка: ${status}`;
    
    if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (typeof errorData === 'object') {
      const fieldErrors = Object.entries(errorData)
        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
        .join('; ');
      errorMessage = fieldErrors || JSON.stringify(errorData);
    }
    
    throw new Error(errorMessage);
  } else if (error.request) {
    throw new Error('Не удалось соединиться с сервером');
  } else {
    throw new Error(error.message || 'Неизвестная ошибка');
  }
};

export const stockService = {
  async getStocks({
    page = 1,
    search = '',
    article = '',
    low_stock = '',
  } = {}) {
    try {
      const params = {
        ...(search && { search }),
        ...(article && { article }),
        ...(low_stock && { low_stock }),
      };

      const response = await axios.get(`${API_BASE_URL}/stocks/`, { params });
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async getStocksByUrl(url) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка при загрузке данных: ${error.response?.data?.message || error.message}`);
    }
  },

  async getLowStock() {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/low_stock/`);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async getStockById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/${id}/`);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async updateStock(id, stockData) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/stocks/${id}/update_stock/`, 
        stockData, 
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async bulkUpdate(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/stocks/bulk_update/`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async downloadTemplate() {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/download_template/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async createStock(stockData) {
    try {
      
      const response = await axios.post(`${API_BASE_URL}/stocks/`, stockData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  async deleteStock(id) {
    try {
      await axios.delete(`${API_BASE_URL}/stocks/${id}/`);
      return { success: true };
    } catch (error) {
      handleAxiosError(error);
    }
  }
};