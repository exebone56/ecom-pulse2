import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const handleAxiosError = (error) => {
  console.error('API Error:', error);
  
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

const createFormData = (data) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  return formData;
};

export const productApi = {
    async getProducts({
        page = 1,
        search = '',
        category = '',
        country = '',
        direction = '',
        is_active = '',
        date_from = '',
        date_to = '' 
    } = {}) {
        try {
            const params = {
                page,
                ...(search && { search }),
                ...(category && { category }),
                ...(country && { country }),
                ...(direction && { direction }),
                ...(is_active !== '' && { is_active }),
                ...(date_from && { created_at_after: date_from }),
                ...(date_to && { created_at_before: date_to }),
            };

            console.log('Fetching products with params:', params);
            
            const response = await axios.get(`${API_BASE_URL}/products/`, { params });
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async getCategories() {
        try {
            const response = await axios.get(`${API_BASE_URL}/categories/`);
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async getFilters() {
        try {
            const response = await axios.get(`${API_BASE_URL}/filter-options/`);
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async getProductById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/${id}/`);
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async updateProduct(id, productData) {
        try {
            console.log('Updating product with data:', productData);
            
            const formData = createFormData(productData);

            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await axios.patch(`${API_BASE_URL}/products/${id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async createProduct(productData) {
        try {
            console.log('Creating product with data:', productData);
            
            const formData = createFormData(productData);

            console.log('FormData entries for creation:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await axios.post(`${API_BASE_URL}/products/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async deleteProduct(id) {
        try {
            await axios.delete(`${API_BASE_URL}/products/${id}/`);
            return { success: true };
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async uploadProductImage(productId, imageFile, altText = '') {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            if (altText) formData.append('alt_text', altText);
            
            const response = await axios.post(`${API_BASE_URL}/products/${productId}/images/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async deleteProductImage(productId, imageId) {
        try {
            await axios.delete(`${API_BASE_URL}/products/${productId}/images/${imageId}/`);
            return { success: true };
        } catch (error) {
            handleAxiosError(error);
        }
    },

    // Получить дополнительные изображения
    async getProductImages(productId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/${productId}/images/`);
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    },

    async getRoles() {
        try {
            const response = await axios.get(`${API_BASE_URL}/users/roles/`);
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    }
};