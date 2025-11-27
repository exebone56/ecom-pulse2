// services/documentService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Создаем экземпляр axios с настройками
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления JWT токена
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const documentService = {
    async getDocuments(params = {}) {
        try {
            const response = await apiClient.get('/documents/', { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка загрузки документов');
        }
    },

    async getDocumentById(documentId) {
        try {
            const response = await apiClient.get(`/documents/${documentId}/`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка загрузки документа');
        }
    },

    async createDocument(documentData) {
        try {
            const formattedData = {
                document_type: documentData.document_type,
                partner: documentData.partner || '',
                source_warehouse: documentData.source_warehouse || null,
                destination_warehouse: documentData.destination_warehouse || null,
                currency: documentData.currency || 'RUB',
                notes: documentData.notes || '',
                status: documentData.status || 'draft',
                items: documentData.items.map(item => ({
                    product: item.product,
                    quantity: parseInt(item.quantity) || 0,
                    price: parseFloat(item.price) || 0,
                    total_cost: parseFloat(item.total_cost) || 0,
                    batch_number: item.batch_number || '',
                    expiration_date: item.expiration_date || null,
                    notes: item.notes || ''
                }))
            };

            const response = await apiClient.post('/documents/', formattedData);
            
            return response.data;
        } catch (error) {
           
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.message || 
                               Object.values(error.response?.data || {}).flat().join(', ') || 
                               'Ошибка создания документа';
            throw new Error(errorMessage);
        }
    },


    async updateDocument(documentId, documentData) {
        try {
            const response = await apiClient.patch(`/documents/${documentId}/`, documentData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка обновления документа');
        }
    },

    async deleteDocument(documentId) {
        try {
            await apiClient.delete(`/documents/${documentId}/`);
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка удаления документа');
        }
    },

    async addDocumentItem(documentId, itemData) {
        try {
            const response = await apiClient.post(`/documents/${documentId}/add_item/`, itemData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка добавления позиции в документ');
        }
    },

    async updateDocumentItem(documentId, itemId, itemData) {
        try {
            const response = await apiClient.post(`/documents/${documentId}/update_item/`, {
                item_id: itemId,
                ...itemData
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка обновления позиции документа');
        }
    },

    async removeDocumentItem(documentId, itemId) {
        try {
            const response = await apiClient.post(`/documents/${documentId}/remove_item/`, {
                item_id: itemId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка удаления позиции из документа');
        }
    },

    async changeDocumentStatus(documentId, status) {
        try {
            const response = await apiClient.post(`/documents/${documentId}/change_status/`, { status });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка изменения статуса документа');
        }
    },

    async completeDocument(documentId) {
    try {
        
        const response = await apiClient.post(`/documents/${documentId}/complete/`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           Object.values(error.response?.data || {}).flat().join(', ') || 
                           'Ошибка завершения документа';
        throw new Error(errorMessage);
    }
},

    async getDocumentHistory(documentId) {
        try {
            const response = await apiClient.get(`/documents/${documentId}/history/`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка загрузки истории документа');
        }
    },

    async getDocumentItems(documentId) {
        try {
            const response = await apiClient.get('/document-items/', {
                params: { document: documentId }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Ошибка загрузки позиций документа');
        }
    }
};