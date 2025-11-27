import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Select from 'react-select'
import MainLayout from '../Layout/MainLayout'
import Input from '../UI/Buttons/Input'
import ImageUploader from '../ImageUploader'
import { useProduct } from '../../hooks/useProduct'
import { marketplaceApi } from '../../services/marketplaceApi'
import { productApi } from '../../services/productApi'
import { useFilterOptions } from '../../hooks/useFilterOptions' // Добавляем хук для фильтров

import MarketplaceBlock from '../MarketplaceBlock'

const ProductEditPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { product, loading, error, updateProduct } = useProduct(id)
    
    // Используем хук для загрузки опций фильтров
    const { filterOptions, loading: filtersLoading } = useFilterOptions()
    const { countries: apiCountries, directions: apiDirections } = filterOptions

    const [marketplaces, setMarketplaces] = useState([])
    const [productMarketplaces, setProductMarketplaces] = useState([])
    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(false) // Добавляем состояние загрузки категорий

    useEffect(() => {
        const loadMarketplaces = async () => {
            try {
                const data = await marketplaceApi.getMarketplaces()
                setMarketplaces(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Ошибка загрузки маркетплейсов:', error)
            }
        }
        loadMarketplaces()
    }, [])

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategoriesLoading(true)
                const data = await productApi.getCategories()
                const formattedCategories = Array.isArray(data)
                    ? data.map(category => ({
                        value: category.id,
                        label: category.name
                    }))
                    : []
                setCategories(formattedCategories)
            } catch (error) {
                setCategories([])
            } finally {
                setCategoriesLoading(false)
            }
        }

        loadCategories()
    }, [])

    const [formData, setFormData] = useState({
        article: '',
        description: '',
        category: null,
        country: '',
        direction: '',
        packing_length: '',
        packing_width: '',
        packing_height: '',
        packing_weight: '',
        notes: {},
        is_active: true
    })
    
    const [additionalImages, setAdditionalImages] = useState([])
    const [mainImage, setMainImage] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (product && apiCountries.length > 0 && apiDirections.length > 0) {
            const productCategory = categories.find(cat => cat.value === product.category)

            const currentCountry = apiCountries.find(country => country.id === product.country) || 
                                 apiCountries.find(country => country.code === product.country)
            const currentDirection = apiDirections.find(direction => direction.id === product.direction) || 
                                    apiDirections.find(direction => direction.code === product.direction)

            setFormData({
                article: product.article || '',
                description: product.description || '',
                category: productCategory || null,
                country: currentCountry?.id || '',
                direction: currentDirection?.id || '',
                packing_length: product.packing_length || '',
                packing_width: product.packing_width || '',
                packing_height: product.packing_height || '',
                packing_weight: product.packing_weight || '',
                notes: product.notes || {},
                is_active: product.is_active
            })
            
            if (product.main_img_url) {
                setMainImage(product.main_img_url)
            } else if (product.main_img) {
                setMainImage(`http://localhost:8000${product.main_img}`)
            }
            
            if (product.additional_images) {
                setAdditionalImages(product.additional_images)
            }
        }
    }, [product, categories, apiCountries, apiDirections])

    const loadProductMarketplaces = async () => {
        try {
            const data = await marketplaceApi.getProductMarketplaces(id)
            const safeData = data.map(item => ({ ...item }))
            setProductMarketplaces(Array.isArray(safeData) ? safeData : [])
        } catch (error) {
            setProductMarketplaces([])
        }
    }

    useEffect(() => {
        if (id) {
            loadProductMarketplaces()
        }
    }, [id])

    const marketplaceProductsMap = useMemo(() => {
        const map = {}
        if (Array.isArray(productMarketplaces)) {
            productMarketplaces.forEach((mp, index) => {
                if (mp && mp.marketplace) {
                    map[mp.marketplace] = { ...mp } // создаем копию
                }
            })
        }
        return map
    }, [productMarketplaces])

    const handleMarketplaceUpdate = async (marketplaceId, data) => {
        try {
            await marketplaceApi.updateMarketplaceProduct(id, marketplaceId, data)
            await loadProductMarketplaces()
        } catch (error) {
            alert('Ошибка обновления: ' + error.message)
        }
    }

    const handleMarketplaceDelete = async (marketplaceId) => {
        try {
            await marketplaceApi.deleteMarketplaceProduct(id, marketplaceId)
            await loadProductMarketplaces()
        } catch (error) {
            alert('Ошибка удаления: ' + error.message)
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            'ACTIVE': 'bg-green-500',
            'DRAFT': 'bg-gray-500',
            'MODERATION': 'bg-yellow-500',
            'REJECTED': 'bg-red-500',
            'INACTIVE': 'bg-gray-400',
            'ARCHIVED': 'bg-purple-500'
        }
        return colors[status] || 'bg-gray-500'
    }

    const getStatusIcon = (status) => {
        const icons = {
            'ACTIVE': '🟢',
            'DRAFT': '⚫',
            'MODERATION': '🟡',
            'REJECTED': '🔴',
            'INACTIVE': '⚪',
            'ARCHIVED': '🟣'
        }
        return icons[status] || '⚫'
    }

    const countryOptions = useMemo(() => {
        return apiCountries.map(country => ({
            value: country.id,
            label: country.name
        }))
    }, [apiCountries])

    const directionOptions = useMemo(() => {
        return apiDirections.map(direction => ({
            value: direction.id,
            label: direction.name
        }))
    }, [apiDirections])

    const categoryOptions = categories;

    const selectedCountry = countryOptions.find(opt => opt.value === formData.country)
    const selectedDirection = directionOptions.find(opt => opt.value === formData.direction)

    const customStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: '#35353B',
            border: 'solid 1px',
            borderColor: '#4b5563',
            color: 'white',
            borderRadius: '8px',
            padding: '4px 8px',
            display: "flex",
            cursor: "pointer"
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: '#1f2937',
            borderRadius: '8px',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#374151' : '#1f2937',
            color: 'white',
            '&:hover': {
                backgroundColor: '#374151',
            },
        }),
        singleValue: (base) => ({
            ...base,
            color: 'white',
        }),
        input: (base) => ({
            ...base,
            color: 'white',
        }),
        placeholder: (base) => ({
            ...base,
            color: '#9ca3af',
        }),
    }

    if (loading || filtersLoading || categoriesLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Загрузка товара...</div>
                </div>
            </MainLayout>
        )
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-red-500 text-lg">Ошибка: {error}</div>
                </div>
            </MainLayout>
        )
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleImagesChange = (images) => {
        setAdditionalImages(images)
    }

    const handleMainImageChange = (file) => {
        setMainImage(file)
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            
            const dataToSend = {
                ...formData,
                category: formData.category?.value || formData.category
            }
            
            if (mainImage instanceof File) {
                dataToSend.main_img = mainImage
            }
            
            await updateProduct(dataToSend)
     
            alert('Товар успешно обновлен!')
            navigate('/products')
            
        } catch (error) {
            alert('Ошибка при сохранении: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <MainLayout>
            <div className="flex flex-col">
                {/* Заголовок и кнопка сохранения */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">
                        Редактирование товара: {product?.article}
                    </h1>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate('/products')}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-x-10 justify-between">
                    <div className='w-full'>
                        <div className="flex flex-col text-[12px] mb-5 text-white/70">
                            <span>Товар создан: <strong>{product ? new Date(product.created_at).toLocaleString('ru-RU') : '-'}</strong></span>
                            <span>Последний раз обновлен: <strong>{product ? new Date(product.updated_at).toLocaleString('ru-RU') : '-'}</strong></span>
                        </div>
                        
                        <div className="flex flex-col items-start gap-y-5">
                            <div className="w-full">
                                <ImageUploader 
                                    productId={id}
                                    onImagesChange={handleImagesChange}
                                    mainImage={mainImage}
                                    onMainImageChange={handleMainImageChange}
                                />
                            </div>
                            
                            <div className="w-full flex flex-col gap-y-2">
                                <label className='flex flex-col'>
                                    <span>Артикул товара</span>
                                    <Input 
                                        type="text" 
                                        placeholder="Введите артикул товара"
                                        value={formData.article}
                                        onChange={(e) => handleInputChange('article', e.target.value)}
                                    />
                                </label>
                                
                                <label className='flex flex-col'>
                                    <span>Страна производства</span>
                                    <Select
                                        options={countryOptions}
                                        value={selectedCountry}
                                        onChange={(selected) => handleInputChange('country', selected.value)}
                                        styles={customStyles}
                                        placeholder="Выберите страну..."
                                        isLoading={filtersLoading}
                                    />
                                </label>
                                
                                <label className='flex flex-col'>
                                    <span>Направление товара</span>
                                    <Select
                                        options={directionOptions}
                                        value={selectedDirection}
                                        onChange={(selected) => handleInputChange('direction', selected.value)}
                                        styles={customStyles}
                                        placeholder="Выберите направление..."
                                        isLoading={filtersLoading}
                                    />
                                </label>
                                
                                <label className='flex flex-col'>
                                    <span>Внутренняя категория товара</span>
                                    <Select
                                        options={categoryOptions}
                                        value={formData.category}
                                        onChange={(selected) => handleInputChange('category', selected)}
                                        isSearchable
                                        styles={customStyles}
                                        placeholder="Выберите категорию..."
                                        noOptionsMessage={() => "Категория не найдена"}
                                        isLoading={categoriesLoading}
                                    />
                                </label>
                            </div>
                            
                            <div className="w-full flex flex-col gap-y-2">
                                <span>Габариты и вес упаковки товара</span>
                                <div className="flex justify-between gap-x-4 border-2 rounded-lg border-white/10 p-5">
                                    <label className='flex flex-col gap-y-1'>
                                        <span className='text-[14px]'>Длина (см)</span>
                                        <Input 
                                            type="number" 
                                            placeholder="Введите длину упаковки"
                                            value={formData.packing_length}
                                            onChange={(e) => handleInputChange('packing_length', e.target.value)}
                                        />
                                    </label>
                                    <label className='flex flex-col gap-y-1'>
                                        <span className='text-[14px]'>Ширина (см)</span>
                                        <Input 
                                            type="number" 
                                            placeholder="Введите ширину упаковки"
                                            value={formData.packing_width}
                                            onChange={(e) => handleInputChange('packing_width', e.target.value)}
                                        />
                                    </label>
                                    <label className='flex flex-col gap-y-1'>
                                        <span className='text-[14px]'>Высота (см)</span>
                                        <Input 
                                            type="number" 
                                            placeholder="Введите высоту упаковки"
                                            value={formData.packing_height}
                                            onChange={(e) => handleInputChange('packing_height', e.target.value)}
                                        />
                                    </label>
                                    <label className='flex flex-col gap-y-1'>
                                        <span className='text-[14px]'>Вес (кг)</span>
                                        <Input 
                                            type="number" 
                                            step="0.001"
                                            placeholder="Введите вес с упаковкой"
                                            value={formData.packing_weight}
                                            onChange={(e) => handleInputChange('packing_weight', e.target.value)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <label className='flex flex-col pt-4'>
                            <span>Описание товара</span>
                            <textarea 
                                placeholder="Введите описание товара" 
                                className='h-full max-h-[350px] rounded-lg px-3 bg-white/5 border border-white/10 p-5 text-white placeholder-gray-400 focus:ring-1 transition-all duration-300'
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </label>
                    </div>
                    
                    <div className="flex flex-col gap-y-3">
                        <div className="bg-white/5 rounded-lg border-white/10 border-2">
                            {mainImage ? (
                                <img 
                                    className="w-full h-full object-cover rounded-lg" 
                                    src={mainImage instanceof File ? URL.createObjectURL(mainImage) : mainImage}
                                    alt="Главное изображение"
                                />
                            ) : (
                                <div className="w-64 h-64 flex items-center justify-center text-gray-500">
                                    Нет изображения
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-x-2">
                            <div className="w-full h-20 bg-[#5C2952] rounded-lg flex flex-col items-center justify-center uppercase font-medium">
                                Wildberries
                                <span className='flex items-center'>
                                    <span className='text-[12px]'>&#x1F534;</span>не размещен
                                </span>
                            </div>
                            <div className="w-full h-20 bg-[#264C64] rounded-lg flex flex-col items-center justify-center uppercase font-medium">
                                Ozon
                                <span className='flex items-center'>
                                    <span className='text-[12px]'>&#x1F7E2;</span>размещен
                                </span>
                            </div>
                            <div className="w-full h-20 bg-[#7E6341] rounded-lg flex flex-col items-center justify-center uppercase font-medium">
                                Yandex Market
                                <span className='flex items-center'>
                                    <span className='text-[12px]'>&#x1F7E2;</span>размещен
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-y-5 pt-5">
                    <span className='uppercase cursor-default text-center text-white/50'>Данные для маркетплейсов</span>
                     {marketplaces.map((marketplace, index) => {
                        const marketplaceProduct = marketplaceProductsMap[marketplace.id]
                        const status = marketplaceProduct?.status || 'DRAFT'
                        
                        console.log(`=== RENDERING CHECK ===`)
                        console.log('Marketplace:', {id: marketplace.id, name: marketplace.name})
                        console.log('Found product:', marketplaceProduct)
                        
                        // Проверим соответствие
                        if (marketplaceProduct && marketplaceProduct.marketplace !== marketplace.id) {
                            console.error('❌ MISMATCH!', {
                                expectedMarketplace: marketplace.id,
                                actualMarketplace: marketplaceProduct.marketplace,
                                productData: marketplaceProduct
                            })
                        }

                        return (
                            <MarketplaceBlock
                                key={marketplace.id}
                                marketplace={marketplace}
                                marketplaceProduct={marketplaceProduct}
                                productId={id}
                                onUpdate={handleMarketplaceUpdate}
                                onDelete={handleMarketplaceDelete}
                                statusColor={getStatusColor(status)}
                                statusIcon={getStatusIcon(status)}
                            />
                        )
                    })}
                </div>
            </div>
        </MainLayout>
    )
}

export default ProductEditPage