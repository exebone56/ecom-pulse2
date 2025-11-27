// hooks/useProduct.js
import { useState, useEffect } from 'react';
import { productApi } from '../services/productApi';

export const useProduct = (productId) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadProduct = async () => {
        if (!productId) {
            setLoading(false);
            setError('ID товара не указан');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await productApi.getProductById(productId);
            setProduct(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProduct();
    }, [productId]);

    const updateProduct = async (productData) => {
        try {
            const updatedProduct = await productApi.updateProduct(productId, productData);
            setProduct(updatedProduct);
            return updatedProduct;
        } catch (err) {
            throw err;
        }
    };

    return {
        product,
        loading,
        error,
        updateProduct,
        refreshProduct: loadProduct
    };
};