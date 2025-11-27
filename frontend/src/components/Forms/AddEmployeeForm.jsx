import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../UI/Modal';
import Input from '../UI/Buttons/Input';
import Button from '../UI/Buttons/Button';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

const AddEmployeeForm = ({ isOpen, onClose, onSuccess }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [roles, setRoles] = useState([]); // Добавляем состояние для ролей
    const [rolesLoading, setRolesLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: '',
        department: '',
        phone_number: '',
        birth_date: '',
        employment_date: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        try {
            setRolesLoading(true);
            const response = await fetch('http://127.0.0.1:8000/api/emoloyees/roles/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки ролей');
            }

            const rolesData = await response.json();
            setRoles(rolesData);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Не удалось загрузить список ролей');
        } finally {
            setRolesLoading(false);
        }
    };

    // Генерация пароля
    const generatePassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        setGeneratedPassword(password);
        setShowPassword(true);
        setCopied(false);
    };

    // Копирование пароля
    const copyToClipboard = async () => {
        if (generatedPassword) {
            try {
                await navigator.clipboard.writeText(generatedPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy password: ', err);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      if (!formData.role) {
          setError('Выберите роль сотрудника');
          setLoading(false);
          return;
      }

      let finalPassword = generatedPassword;
      if (!finalPassword) {
          generatePassword();
          finalPassword = generatedPassword;
          await new Promise(resolve => setTimeout(resolve, 100));
      }

      const requestData = {
          username: formData.username?.trim() || '',
          email: formData.email?.trim() || '',
          first_name: formData.first_name?.trim() || '',
          last_name: formData.last_name?.trim() || '',
          role: formData.role, // Отправляем роль вместо position
          department: formData.department?.trim() || '',
          phone_number: formData.phone_number?.trim() || '',
          birth_date: formData.birth_date || null,
          employment_date: formData.employment_date || '',
          password1: finalPassword,
          password2: finalPassword
      };

      try {
          const response = await fetch('http://127.0.0.1:8000/api/employees/register/', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
          });

          if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = 'Ошибка при добавлении сотрудника';
              
              try {
                  const errorData = JSON.parse(errorText);
                  if (typeof errorData === 'object') {
                      const fieldErrors = Object.entries(errorData)
                          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                          .join('; ');
                      errorMessage = fieldErrors || JSON.stringify(errorData);
                  }
              } catch (e) {
                  errorMessage = errorText || 'Неизвестная ошибка';
              }
              
              throw new Error(errorMessage);
          }

          onSuccess();
          handleClose();
          
      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

    const handleClose = () => {
        setFormData({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            role: '',
            department: '',
            phone_number: '',
            birth_date: '',
            employment_date: ''
        });
        setGeneratedPassword('');
        setShowPassword(false);
        setError(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} headerForm="Добавить сотрудника">
            <div className="rounded-lg w-full max-w-2xl mx-auto p-6 text-white">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Основная информация */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Имя *"
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            label="Фамилия *"
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Логин *"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            label="Email *"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">
                                Роль в системе *
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                required
                                disabled={rolesLoading}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none transition-colors duration-200"
                            >
                                <option value="">Выберите роль</option>
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            {rolesLoading && (
                                <p className="text-xs text-gray-400 mt-1">Загрузка ролей...</p>
                            )}
                        </div>
                        
                        <Input
                            label="Отдел"
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Телефон"
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Дата рождения"
                            type="date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleInputChange}
                        />
                    </div>

                    <Input
                        label="Дата приема на работу"
                        type="date"
                        name="employment_date"
                        value={formData.employment_date}
                        onChange={handleInputChange}
                    />

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium mb-2">
                            Пароль сотрудника *
                        </label>
                        
                        <div className="flex gap-2 mb-3">
                            <Button
                                type="button"
                                bgColor="#3B82F6"
                                onClick={generatePassword}
                                disabled={loading}
                            >
                                <RefreshIcon className="mr-1" />
                                Сгенерировать пароль
                            </Button>
                            
                            {generatedPassword && (
                                <Button
                                    type="button"
                                    bgColor="#10B981"
                                    onClick={copyToClipboard}
                                    disabled={loading}
                                >
                                    <ContentCopyIcon className="mr-1" />
                                    {copied ? 'Скопировано!' : 'Копировать'}
                                </Button>
                            )}
                        </div>

                        {showPassword && generatedPassword && (
                            <div className="border border-yellow-200 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <code className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                                        {generatedPassword}
                                    </code>
                                    <span className="text-xs text-red-400 font-semibold">
                                        ✓ Сохраните этот пароль!
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                    Пароль будет показан только один раз. Обязательно сохраните его и передайте сотруднику.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Сообщение об ошибке */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            bgColor="#6B7280"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            bgColor="#407E41"
                            disabled={loading || !generatedPassword || !formData.role}
                        >
                            {loading ? 'Добавление...' : 'Добавить сотрудника'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddEmployeeForm;