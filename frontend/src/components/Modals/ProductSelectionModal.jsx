import React from 'react'
import { useState } from 'react';

const ProductSelectionModal = ({onClose, availableProducts, onProductSelected}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = availableProducts.filter(product =>
        product.article.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark border-2 border-white/25 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Выберите товар</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Поиск по артикулу */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Введите артикул товара..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-white/25 rounded bg-transparent text-white"
                        autoFocus
                    />
                </div>
                
                {/* Список товаров */}
                <div className="overflow-y-auto max-h-96">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'Товары не найдены' : 'Введите артикул для поиска'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => onProductSelected(product)}
                                    className="w-full flex items-center gap-3 p-3 border border-white/10 rounded hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center flex-shrink-0">
                                        {product.img ? (
                                            <img src={product.img} className="w-full h-full object-cover rounded" alt="" />
                                        ) : (
                                            <span>📦</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{product.article}</div>
                                        <div className="text-sm text-gray-400 truncate">{product.name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ); 
}

export default ProductSelectionModal