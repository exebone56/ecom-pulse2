// MarketplaceBlock.jsx
import { useState, useEffect } from 'react'

const MarketplaceBlock = ({ 
    marketplace, 
    marketplaceProduct, 
    productId, 
    onUpdate, 
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        barcode: '',
        external_sku: '',
        external_product_id: '',
        status: 'DRAFT',
        sync_enabled: true
    })

    useEffect(() => {
        if (marketplaceProduct) {
            setFormData({
                barcode: marketplaceProduct.barcode || '',
                external_sku: marketplaceProduct.external_sku || '',
                external_product_id: marketplaceProduct.external_product_id || '',
                status: marketplaceProduct.status || 'DRAFT',
                sync_enabled: marketplaceProduct.sync_enabled ?? true
            })
        } else {
            setFormData({
                barcode: '',
                external_sku: '',
                external_product_id: '',
                status: 'DRAFT',
                sync_enabled: true
            })
        }
    }, [marketplaceProduct])

    const handleSave = async () => {
        try {
            await onUpdate(marketplace.id, formData)
            setIsEditing(false)
        } catch (error) {
            // Ошибка обрабатывается в родительском компоненте
        }
    }

    const handleCancel = () => {
        if (marketplaceProduct) {
            setFormData({
                barcode: marketplaceProduct.barcode || '',
                external_sku: marketplaceProduct.external_sku || '',
                external_product_id: marketplaceProduct.external_product_id || '',
                status: marketplaceProduct.status || 'DRAFT',
                sync_enabled: marketplaceProduct.sync_enabled ?? true
            })
        } else {
            setFormData({
                barcode: '',
                external_sku: '',
                external_product_id: '',
                status: 'DRAFT',
                sync_enabled: true
            })
        }
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (window.confirm(`Удалить товар с маркетплейса ${marketplace.name}?`)) {
            await onDelete(marketplace.id)
        }
    }

    return (
        <div className="border-2 rounded-lg p-4 border-white/10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{marketplace.name}</h3>
                <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                        marketplaceProduct ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                        {marketplaceProduct ? '🟢 Размещен' : '⚪ Не размещен'}
                    </span>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                        {isEditing ? 'Отмена' : 'Редактировать'}
                    </button>
                    {marketplaceProduct && (
                        <button
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Удалить
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Штрихкод</label>
                        <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                            className="w-full p-2 rounded bg-white/10 border border-white/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Внешний артикул</label>
                        <input
                            type="text"
                            value={formData.external_sku}
                            onChange={(e) => setFormData(prev => ({ ...prev, external_sku: e.target.value }))}
                            className="w-full p-2 rounded bg-white/10 border border-white/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">ID товара</label>
                        <input
                            type="text"
                            value={formData.external_product_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, external_product_id: e.target.value }))}
                            className="w-full p-2 rounded bg-white/10 border border-white/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Статус</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full p-2 rounded bg-white/10 border border-white/20"
                        >
                            <option value="DRAFT">Черновик</option>
                            <option value="MODERATION">На модерации</option>
                            <option value="ACTIVE">Активный</option>
                            <option value="INACTIVE">Неактивный</option>
                            <option value="REJECTED">Отклонен</option>
                            <option value="ARCHIVED">В архиве</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.sync_enabled}
                            onChange={(e) => setFormData(prev => ({ ...prev, sync_enabled: e.target.checked }))}
                            className="mr-2"
                        />
                        <label>Синхронизация включена</label>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                            Сохранить
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><strong>Штрихкод:</strong> {marketplaceProduct?.barcode || 'Не указан'}</div>
                    <div><strong>Внешний артикул:</strong> {marketplaceProduct?.external_sku || 'Не указан'}</div>
                    <div><strong>ID товара:</strong> {marketplaceProduct?.external_product_id || 'Не указан'}</div>
                    <div><strong>Статус:</strong> {marketplaceProduct?.status || 'Не размещен'}</div>
                    <div><strong>Синхронизация:</strong> {marketplaceProduct?.sync_enabled ? 'Включена' : 'Выключена'}</div>
                    <div><strong>Обновлен:</strong> {marketplaceProduct?.updated_at ? new Date(marketplaceProduct.updated_at).toLocaleDateString('ru-RU') : 'Никогда'}</div>
                </div>
            )}
        </div>
    )
}

export default MarketplaceBlock