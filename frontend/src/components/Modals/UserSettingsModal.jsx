import { useRef, useState } from 'react'

import Modal from '../UI/Modal'
import Input from '../UI/Buttons/Input'
import Button from '../UI/Buttons/Button'


const UserSettingsModal = ({onClose, user, onUserUpdate}) => {
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        birthday: user.birth_date || '',
        phone_number: user.phone_number || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const employmentDate = user.employment_date;
    const department = user.department;
    const position = user.position;

    const updateUserProfile = async (data) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/update-profile/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка обновления');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const updateUserAvatar = async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/update-avatar/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка загрузки аватара');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        setTimeout(() => {
            const error = validateField(field, value);
            setErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }, 500);
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'first_name':
                if (!value.trim()) return 'Имя обязательно для заполнения';
                if (value.length < 2) return 'Имя должно содержать минимум 2 символа';
                if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Имя может содержать только буквы, пробелы и дефисы';
                return '';
            
            case 'last_name':
                if (!value.trim()) return 'Фамилия обязательна для заполнения';
                if (value.length < 2) return 'Фамилия должна содержать минимум 2 символа';
                if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Фамилия может содержать только буквы, пробелы и дефисы';
                return '';
            
            case 'phone_number':
                if (value && !/^[\+]?[78][-\s]?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/.test(value)) {
                    return 'Введите корректный номер телефона';
                }
                return '';
            
            case 'birthday':
                if (value) {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const minDate = new Date();
                    minDate.setFullYear(today.getFullYear() - 100);
                    const maxDate = new Date();
                    maxDate.setFullYear(today.getFullYear() - 14);
                    
                    if (birthDate < minDate) return 'Дата рождения не может быть более 100 лет назад';
                    if (birthDate > maxDate) return 'Возраст должен быть не менее 14 лет';
                }
                return '';
            
            default:
                return '';
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
            
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });
            
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const updatedUser = await updateUserProfile(formData);
            if (onUserUpdate) {
                onUserUpdate(updatedUser);
            }
            onClose();
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Проверка размера файла на фронтенде
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ submit: 'Файл слишком большой (макс. 5MB)' });
                return;
            }

            setAvatarLoading(true);
            try {
                const updatedUser = await updateUserAvatar(file);
                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            } catch (error) {
                setErrors({ submit: error.message });
            } finally {
                setAvatarLoading(false);
                // Очищаем input
                event.target.value = '';
            }
        }
    };

    const validatePassword = () => {
        const newErrors = {};
        
        if (!passwordData.old_password.trim()) {
            newErrors.old_password = 'Текущий пароль обязателен';
        }
        
        if (!passwordData.new_password.trim()) {
            newErrors.new_password = 'Новый пароль обязателен';
        } else if (passwordData.new_password.length < 8) {
            newErrors.new_password = 'Пароль должен содержать минимум 8 символов';
        }
        
        if (!passwordData.confirm_password.trim()) {
            newErrors.confirm_password = 'Подтверждение пароля обязательно';
        } else if (passwordData.new_password !== passwordData.confirm_password) {
            newErrors.confirm_password = 'Пароли не совпадают';
        }
        
        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
        
        // Очищаем ошибку при изменении
        if (passwordErrors[field]) {
            setPasswordErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleChangePassword = async () => {
        if (!validatePassword()) return;
        
        setIsPasswordLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...passwordData,
                    refresh: localStorage.getItem('refreshToken')
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || Object.values(errorData).join(', ') || 'Ошибка смены пароля');
            }

            setPasswordData({
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
            setShowChangePassword(false);
            
            setErrors({ submit: 'Пароль успешно изменен!' });
            
            setTimeout(() => {
                setErrors(prev => ({ ...prev, submit: '' }));
            }, 3000);
            
        } catch (error) {
            setPasswordErrors(prev => ({ 
                ...prev, 
                submit: error.message 
            }));
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const cancelPasswordChange = () => {
        setShowChangePassword(false);
        setPasswordData({
            old_password: '',
            new_password: '',
            confirm_password: ''
        });
        setPasswordErrors({});
    };

    
  return (
    <Modal 
        onClose={onClose}
        headerForm="Настройки пользователя"
    >
        {errors.submit && (
            <div className={`mb-4 p-3 border rounded text-sm ${
                errors.submit.includes('успешно') 
                    ? 'bg-green-100 border-green-400 text-green-700' 
                    : 'bg-red-100 border-red-400 text-red-700'
            }`}>
                {errors.submit}
            </div>
        )}
        <div className="flex gap-5">
            <div className='w-full flex flex-col gap-y-4'>
                <div className="flex flex-col gap-y-1">
                    <label>Имя:</label>
                    <Input 
                        type="text" 
                        value={formData.first_name} 
                        onChange={(e) => handleChange('first_name', e.target.value)}
                    />
                    {errors.first_name && (
                        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span>
                            {errors.first_name}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-y-1">
                    <label>Фамилия:</label>
                    <Input 
                        type="text" 
                        value={formData.last_name} 
                        onChange={(e) => handleChange('last_name', e.target.value)}
                    />
                    {errors.last_name && (
                        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span>
                            {errors.last_name}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-y-1">
                    <label>Дата рождения:</label>
                    <Input 
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => handleChange('birthday', e.target.value)}
                    />
                    {errors.birthday && (
                        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span>
                            {errors.birthday}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-y-1">
                    <label>Номер мобильного телефона:</label>
                    <Input 
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => handleChange('phone_number', e.target.value)}
                        placeholder="+7 (XXX) XXX-XX-XX"
                    />
                </div>

                <div className="pt-4 border-t border-gray-200 relative">
                    {!showChangePassword ? (
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-medium text-white">Пароль</h3>
                                <p className="text-sm text-gray-500">Измените ваш пароль</p>
                            </div>
                            <div className="div">
                                <Button 
                                onClick={() => setShowChangePassword(true)}
                                bgColor="#6B7280"
                                >
                                    Сменить пароль
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-dark p-4 rounded-lg absolute top-[-100px] w-120 border-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-white">Смена пароля</h3>
                                <button 
                                    onClick={cancelPasswordChange}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {/* Ошибки смены пароля */}
                            {passwordErrors.submit && (
                                <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                    {passwordErrors.submit}
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                <div className="flex flex-col gap-y-1">
                                    <label className="font-medium text-sm">Текущий пароль:</label>
                                    <Input 
                                        type="password"
                                        value={passwordData.old_password}
                                        onChange={(e) => handlePasswordChange('old_password', e.target.value)}
                                        className={passwordErrors.old_password ? 'border-red-500 focus:border-red-500' : ''}
                                        placeholder="Введите текущий пароль"
                                    />
                                    {passwordErrors.old_password && (
                                        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <span>⚠</span>
                                            {passwordErrors.old_password}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-y-1">
                                    <label className="font-medium text-sm">Новый пароль:</label>
                                    <Input 
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                                        className={passwordErrors.new_password ? 'border-red-500 focus:border-red-500' : ''}
                                        placeholder="Введите новый пароль (мин. 8 символов)"
                                    />
                                    {passwordErrors.new_password && (
                                        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <span>⚠</span>
                                            {passwordErrors.new_password}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-y-1">
                                    <label className="font-medium text-sm">Подтвердите новый пароль:</label>
                                    <Input 
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                                        className={passwordErrors.confirm_password ? 'border-red-500 focus:border-red-500' : ''}
                                        placeholder="Повторите новый пароль"
                                    />
                                    {passwordErrors.confirm_password && (
                                        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <span>⚠</span>
                                            {passwordErrors.confirm_password}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                    <Button 
                                        variant="outline"
                                        onClick={cancelPasswordChange}
                                        bgColor="#6B7280"
                                    >
                                        Отмена
                                    </Button>
                                    <Button 
                                        onClick={handleChangePassword}
                                        loading={isPasswordLoading}
                                        bgColor="#407E41"
                                    >
                                        Сохранить пароль
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    Подразделение: {department}
                </div>
                <div>
                    Должность: {position}
                </div>
                <div>
                    Дата трудоустройства: {employmentDate}
                </div>
            </div>
            <div className="flex flex-col gap-y-5">
                 <div className="w-[250px] h-[250px] bg-accent rounded-lg flex flex-col gap-y-2">
                    <img className='w-full h-full rounded-lg object-cover' src={user.avatar_url}></img>
                 </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                />
                <Button 
                    variant="outline" 
                    onClick={handleAvatarClick}
                    bgColor="#7E6341"
                >
                    Сменить аватарку
                </Button>
                <p className="text-xs text-gray-500 text-center">
                    JPG, PNG или GIF<br/>Макс. размер: 5MB
                </p>
            </div>
        </div>
        <div className="pt-5 flex gap-2 justify-end">
            <Button 
                variant="outline" 
                onClick={onClose}
                bgColor="#D23D3D"
            >
                Отмена
            </Button>
            <Button 
                onClick={handleSave} 
                loading={isLoading}
                bgColor="#407E41"
            >
                Сохранить изменения
            </Button>
        </div>
    </Modal>
  )
}

export default UserSettingsModal