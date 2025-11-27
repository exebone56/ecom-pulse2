const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const warehouseService = {
    async getWarehouses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/warehouses/${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Ошибка загрузки складов');
        }
        return response.json();
    },

    async getWarehouseById(warehouseId) {
        const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/`);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки склада');
        }
        return response.json();
    },

    async createWarehouse(warehouseData) {
        const response = await fetch(`${API_BASE_URL}/warehouses/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(warehouseData),
        });

        if (!response.ok) {
            throw new Error('Ошибка создания склада');
        }
        return response.json();
    },

    async updateWarehouse(warehouseId, warehouseData) {
        const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(warehouseData),
        });

        if (!response.ok) {
            throw new Error('Ошибка обновления склада');
        }
        return response.json();
    },

    async deleteWarehouse(warehouseId) {
        const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Ошибка удаления склада');
        }
    },

    async getWarehouseStock(warehouseId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/warehouses/${warehouseId}/stock/${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Ошибка загрузки остатков склада');
        }
        return response.json();
    }
};