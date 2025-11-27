// hooks/useEmployees.js
import { useState, useEffect } from 'react';
import { useAuth } from '../components/contexts/AuthContext';

export const useEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const fetchEmployees = async (filters = {}) => {
        if (!token) return;

        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            
            if (filters.search) params.append('search', filters.search);
            if (filters.department) params.append('department', filters.department);
            if (filters.ordering) params.append('ordering', filters.ordering);
             if (filters.showInactive) params.append('show_inactive', 'true');
            
            const url = `http://127.0.0.1:8000/api/employees/${params.toString() ? `?${params.toString()}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке сотрудников');
            }

            const data = await response.json();
            setEmployees(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addEmployee = async (employeeData) => {
        if (!token) {
            throw new Error('Требуется авторизация');
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/employees/register/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employeeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || 'Ошибка при добавлении сотрудника');
            }

            const newEmployee = await response.json();
            return newEmployee;
            
        } catch (err) {
            throw err;
        }
    };

    const deleteEmployee = async (employeeId) => {
        if (!token) {
            throw new Error('Требуется авторизация');
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/employees/${employeeId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Ошибка при удалении сотрудника';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
                } catch (e) {
                    errorMessage = errorText || 'Неизвестная ошибка';
                }
                
                throw new Error(errorMessage);
            }

            return true;
            
        } catch (err) {
            throw err;
        }
    };

    const activateEmployee = async (employeeId) => {
        if (!token) {
            throw new Error('Требуется авторизация');
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/employees/${employeeId}/activate/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Ошибка при активации сотрудника';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
                } catch (e) {
                    errorMessage = errorText || 'Неизвестная ошибка';
                }
                
                throw new Error(errorMessage);
            }

            return await response.json();
            
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [token]);

    const refetch = (filters = {}) => {
        fetchEmployees(filters);
    };

    return { 
        employees, 
        loading, 
        error, 
        refetch,
        addEmployee,
        deleteEmployee,
        activateEmployee 
    };
};