// ProductCreatePage.jsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import MainLayout from '../Layout/MainLayout'
import Input from '../UI/Buttons/Input'
import ImageUploader from '../ImageUploader'
import { productApi } from '../../services/productApi'
import { useFilterOptions } from '../../hooks/useFilterOptions'

const ProductCreatePage = () => {
    const navigate = useNavigate()
    
    const { filterOptions, loading: filtersLoading } = useFilterOptions()
    const { countries: apiCountries, directions: apiDirections } = filterOptions

    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
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
    
    const [mainImage, setMainImage] = useState(null)
    const [additionalImages, setAdditionalImages] = useState([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Загружаем категории
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
                console.error('Ошибка загрузки категорий:', error)
                setCategories([])
            } finally {
                setCategoriesLoading(false)
            }
        }

        loadCategories()
    }, [])

    useEffect(() => {
        if (apiCountries.length > 0 && apiDirections.length > 0) {
            setFormData(prev => ({
                ...prev,
                country: apiCountries[0]?.id || '',
                direction: apiDirections[0]?.id || ''
            }))
        }
    }, [apiCountries, apiDirections])

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
        // Валидация
        if (!formData.name.trim()) {
            setError('Название товара обязательно для заполнения')
            return
        }

        if (!formData.article.trim()) {
            setError('Артикул товара обязателен для заполнения')
            return
        }

        if (!formData.country) {
            setError('Выберите страну производства')
            return
        }

        if (!formData.direction) {
            setError('Выберите направление товара')
            return
        }

        try {
            setSaving(true)
            setError(null)
            
            const dataToSend = {
                ...formData,
                category: formData.category?.value || formData.category,
                packing_length: formData.packing_length ? parseFloat(formData.packing_length) : null,
                packing_width: formData.packing_width ? parseFloat(formData.packing_width) : null,
                packing_height: formData.packing_height ? parseFloat(formData.packing_height) : null,
                packing_weight: formData.packing_weight ? parseFloat(formData.packing_weight) : null,
            }
            
            Object.keys(dataToSend).forEach(key => {
                if (dataToSend[key] === '') {
                    dataToSend[key] = null;
                }
            });
            
            if (mainImage instanceof File) {
                dataToSend.main_img = mainImage
            }

            const newProduct = await productApi.createProduct(dataToSend)
            if (additionalImages.length > 0 && newProduct.id) {
                const uploadPromises = additionalImages.map(file => 
                    productApi.uploadProductImage(newProduct.id, file)
                )
                await Promise.all(uploadPromises)
            }
            
            alert('Товар успешно создан!')
            navigate('/products')
            
        } catch (error) {
            setError('Ошибка при создании товара: ' + error.message)
        } finally {
            setSaving(false)
        }
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

    const categoryOptions = categories

    const selectedCountry = countryOptions.find(opt => opt.value === formData.country)
    const selectedDirection = directionOptions.find(opt => opt.value === formData.direction)

    const selectedCountryName = selectedCountry?.label || 'не указана'
    const selectedDirectionName = selectedDirection?.label || 'не указано'
    const selectedCategoryName = formData.category?.label || 'не указана'

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

    return (
        <MainLayout>
            <div className="flex flex-col">
                {/* Заголовок и кнопки */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Создание нового товара</h1>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate('/products')}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving || filtersLoading || categoriesLoading}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                        >
                            {saving ? 'Создание...' : 'Создать товар'}
                        </button>
                    </div>
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                    <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Индикаторы загрузки */}
                {(filtersLoading || categoriesLoading) && (
                    <div className="bg-blue-900 text-blue-200 p-3 rounded-lg mb-6">
                        Загрузка данных...
                    </div>
                )}

                <div className="flex gap-x-10 justify-between">
                    <div className='w-full'>
                        <div className="flex flex-col items-start gap-y-5">
                            {/* Загрузчик изображений */}
                            <div className="w-full">
                                <ImageUploader 
                                    onImagesChange={handleImagesChange}
                                    mainImage={mainImage}
                                    onMainImageChange={handleMainImageChange}
                                />
                            </div>
                            
                            {/* Основные поля */}
                            <div className="w-full flex flex-col gap-y-4">
                                <label className='flex flex-col'>
                                    <span className="font-medium mb-2">Название товара *</span>
                                    <Input 
                                        type="text" 
                                        placeholder="Введите название товара"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full"
                                    />
                                </label>

                                <label className='flex flex-col'>
                                    <span className="font-medium mb-2">Артикул товара *</span>
                                    <Input 
                                        type="text" 
                                        placeholder="Введите артикул товара"
                                        value={formData.article}
                                        onChange={(e) => handleInputChange('article', e.target.value)}
                                        className="w-full"
                                    />
                                </label>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <label className='flex flex-col'>
                                        <span className="font-medium mb-2">Страна производства *</span>
                                        <Select
                                            options={countryOptions}
                                            value={selectedCountry}
                                            onChange={(selected) => handleInputChange('country', selected.value)}
                                            styles={customStyles}
                                            placeholder={filtersLoading ? "Загрузка..." : "Выберите страну..."}
                                            isLoading={filtersLoading}
                                        />
                                    </label>
                                    
                                    <label className='flex flex-col'>
                                        <span className="font-medium mb-2">Направление товара *</span>
                                        <Select
                                            options={directionOptions}
                                            value={selectedDirection}
                                            onChange={(selected) => handleInputChange('direction', selected.value)}
                                            styles={customStyles}
                                            placeholder={filtersLoading ? "Загрузка..." : "Выберите направление..."}
                                            isLoading={filtersLoading}
                                        />
                                    </label>
                                </div>
                                
                                <label className='flex flex-col'>
                                    <span className="font-medium mb-2">Категория товара</span>
                                    <Select
                                        options={categoryOptions}
                                        value={formData.category}
                                        onChange={(selected) => handleInputChange('category', selected)}
                                        isSearchable
                                        styles={customStyles}
                                        placeholder={categoriesLoading ? "Загрузка..." : "Выберите категорию..."}
                                        noOptionsMessage={() => "Категория не найдена"}
                                        isLoading={categoriesLoading}
                                    />
                                </label>
                            </div>
                            
                            {/* Габариты и вес */}
                            <div className="w-full flex flex-col gap-y-2">
                                <span className="font-medium">Габариты и вес упаковки товара</span>
                                <div className="grid grid-cols-2 gap-4 border-2 rounded-lg border-white/10 p-5">
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
                        
                        {/* Описание */}
                        <label className='flex flex-col pt-4'>
                            <span className="font-medium mb-2">Описание товара</span>
                            <textarea 
                                placeholder="Введите описание товара" 
                                className='h-40 rounded-lg px-3 bg-white/5 border border-white/10 p-4 text-white placeholder-gray-400 focus:ring-1 transition-all duration-300'
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </label>

                        {/* Статус товара */}
                        <div className="flex items-center gap-2 pt-4">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                className="w-4 h-4"
                            />
                            <label htmlFor="is_active" className="font-medium">
                                Товар активен
                            </label>
                        </div>
                    </div>
                    
                    {/* Боковая панель - предпросмотр */}
                    <div className="flex flex-col gap-y-3 min-w-80">
                        <div className="bg-white/5 rounded-lg border-white/10 border-2 p-4">
                            <h3 className="font-medium mb-2">Предпросмотр</h3>
                            {mainImage ? (
                                <img 
                                    className="w-full h-48 object-cover rounded-lg" 
                                    src={mainImage instanceof File ? URL.createObjectURL(mainImage) : mainImage}
                                    alt="Предпросмотр"
                                />
                            ) : (
                                <div className="w-full h-48 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 rounded-lg">
                                    Изображение не выбрано
                                </div>
                            )}
                            <div className="mt-2 text-sm space-y-1">
                                <div><strong>Название:</strong> {formData.name || 'не указано'}</div>
                                <div><strong>Артикул:</strong> {formData.article || 'не указан'}</div>
                                <div><strong>Страна:</strong> {selectedCountryName}</div>
                                <div><strong>Направление:</strong> {selectedDirectionName}</div>
                                <div><strong>Категория:</strong> {selectedCategoryName}</div>
                                <div><strong>Статус:</strong> {formData.is_active ? 'Активный' : 'Неактивный'}</div>
                            </div>
                        </div>
                        
                        {/* Маркетплейсы */}
                        <div className="flex gap-x-2">
                            <div className="w-full h-20 bg-[#5C2952] rounded-lg flex flex-col items-center justify-center uppercase font-medium text-sm">
                                Wildberries
                                <span className='flex items-center text-xs'>
                                    <span className='text-[10px]'>&#x1F534;</span>не размещен
                                </span>
                            </div>
                            <div className="w-full h-20 bg-[#264C64] rounded-lg flex flex-col items-center justify-center uppercase font-medium text-sm">
                                Ozon
                                <span className='flex items-center text-xs'>
                                    <span className='text-[10px]'>&#x1F534;</span>не размещен
                                </span>
                            </div>
                            <div className="w-full h-20 bg-[#7E6341] rounded-lg flex flex-col items-center justify-center uppercase font-medium text-sm">
                                Yandex Market
                                <span className='flex items-center text-xs'>
                                    <span className='text-[10px]'>&#x1F534;</span>не размещен
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export default ProductCreatePage