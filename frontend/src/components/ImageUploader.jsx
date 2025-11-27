// ImageUploader.jsx
import { useState, useEffect } from 'react'
import { productApi } from '../services/productApi'

const ImageUploader = ({ productId, onImagesChange, mainImage, onMainImageChange }) => {
    const [additionalImages, setAdditionalImages] = useState([])
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (productId) {
            loadExistingImages()
        }
    }, [productId])

    const loadExistingImages = async () => {
        try {
            const images = await productApi.getProductImages(productId)
            const validImages = images.filter(img => 
                img.image_url && !img.image_url.includes('temp')
            )
            setAdditionalImages(validImages)
        } catch (error) {
            console.error('Ошибка загрузки изображений:', error)
        }
    }

    const handleMainImageUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            onMainImageChange(file)
        }
    }

    const handleAdditionalImagesUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0 && productId) {
            setUploading(true)
            try {
                for (const file of files) {
                    await productApi.uploadProductImage(productId, file)
                }
                // Даем время на обработку файлов
                setTimeout(() => {
                    loadExistingImages()
                }, 1000)
            } catch (error) {
                alert('Ошибка загрузки изображений: ' + error.message)
            } finally {
                setUploading(false)
            }
        } else if (!productId) {
            alert('Сначала сохраните товар чтобы загружать изображения')
        }
    }

    const handleDeleteAdditionalImage = async (imageId) => {
        try {
            await productApi.deleteProductImage(productId, imageId)
            setAdditionalImages(prev => prev.filter(img => img.id !== imageId))
            onImagesChange(additionalImages.filter(img => img.id !== imageId))
        } catch (error) {
            alert('Ошибка удаления изображения: ' + error.message)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Главное изображение */}
            <div className="flex flex-col gap-2">
                <span className="font-medium">Главное изображение</span>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="w-full text-white"
                    />
                </div>
                {mainImage && (
                    <div className="mt-2">
                        <img
                            src={mainImage instanceof File ? URL.createObjectURL(mainImage) : mainImage}
                            alt="Главное изображение"
                            className="w-32 h-32 object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>

            {/* Дополнительные изображения */}
            <div className="flex flex-col gap-2">
                <span className="font-medium">Дополнительные изображения</span>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleAdditionalImagesUpload}
                        multiple
                        disabled={uploading}
                        className="w-full text-white disabled:opacity-50"
                    />
                </div>
                
                {uploading && (
                    <div className="text-blue-400 text-sm">Загрузка изображений...</div>
                )}

                {/* Сетка дополнительных изображений */}
                {additionalImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        {additionalImages.map((image) => (
                            <div key={image.id} className="relative group">
                                <img
                                    src={image.image_url || image.image}
                                    alt={image.alt_text || 'Дополнительное изображение'}
                                    className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => handleDeleteAdditionalImage(image.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ImageUploader