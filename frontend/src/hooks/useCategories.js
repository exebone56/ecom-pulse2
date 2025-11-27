import { useState, useEffect } from 'react'

export const useCategories = () => {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/categories/')
            const data = await response.json()
            setCategories(data)
        } catch (error) {
            console.error('Error loading categories:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCategories()
    }, [])

    return {
        categories,
        loading
    }
}