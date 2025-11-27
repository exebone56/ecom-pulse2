const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const marketplaceApi = {
    async getMarketplaces() {
        const response = await fetch(`${API_BASE_URL}/marketplaces/`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки маркетплейсов');
        }
        return response.json();
    },

    async getProductMarketplaces(productId) {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/marketplace-products-list/`);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки маркетплейсов товара');
        }
        return response.json()
    },

    async updateMarketplaceProduct(productId, marketplaceId, data) {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/marketplace-products/${marketplaceId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Ошибка обновления товара на маркетплейсе');
        }
        return response.json();
    },

    async deleteMarketplaceProduct(productId, marketplaceId) {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/marketplace-products/${marketplaceId}/`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Ошибка удаления товара с маркетплейса');
        }
    }

};