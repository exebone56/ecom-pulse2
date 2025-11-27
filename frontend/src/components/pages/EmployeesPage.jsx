import { useState, useEffect, useMemo } from 'react'
import MainLayout from '../Layout/MainLayout'
import DataTable from '../Table/DataTable'
import { employeeTableColumn } from '../../data/tableSettings'
import Button from '../UI/Buttons/Button'
import AddEmployeeForm from '../Forms/AddEmployeeForm'
import EditEmployeeForm from '../Forms/EditEmployeeForm'
import SearchInput from '../UI/SearchInput'
import SelectFilter from '../UI/SelectFilter'
import ConfirmModal from '../UI/ConfirmModal'

import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import CircularProgress from '@mui/material/CircularProgress'
import FilterListIcon from '@mui/icons-material/FilterList'
import SortIcon from '@mui/icons-material/Sort'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

import { useEmployees } from '../../hooks/useEmployees'


const EmployeesPage = () => {
    const [openAddEmployeeForm, setOpenAddEmployeeForm] = useState(false)
    const [openEditEmployeeForm, setOpenEditEmployeeForm] = useState(false)
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [openActivateModal, setOpenActivateModal] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [activateLoading, setActivateLoading] = useState(false)
    
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('')
    const [sortBy, setSortBy] = useState('last_name')
    const [showInactive, setShowInactive] = useState(false)
    
    const { employees, loading, error, refetch, deleteEmployee, activateEmployee } = useEmployees()
    
    const departments = useMemo(() => {
        const deptSet = new Set()
        employees.forEach(emp => {
            if (emp.department) deptSet.add(emp.department)
        })
        return Array.from(deptSet).map(dept => ({ value: dept, label: dept }))
    }, [employees])

    const sortOptions = [
        { value: 'last_name', label: 'По фамилии (А-Я)' },
        { value: '-last_name', label: 'По фамилии (Я-А)' },
        { value: 'first_name', label: 'По имени (А-Я)' },
        { value: '-first_name', label: 'По имени (Я-А)' },
        { value: 'department', label: 'По отделу (А-Я)' },
        { value: '-department', label: 'По отделу (Я-А)' },
        { value: 'role', label: 'По должности (А-Я)' },
        { value: '-role', label: 'По должности (Я-А)' },
        { value: 'employment_date', label: 'По дате приема (старые)' },
        { value: '-employment_date', label: 'По дате приема (новые)' },
        { value: 'is_active', label: 'Сначала активные' },
        { value: '-is_active', label: 'Сначала неактивные' },
    ]

    function handleOpenAddEmployeeForm() {
        setOpenAddEmployeeForm(true)
    }
    
    function handleOpenEditEmployeeForm(employee) {
        setSelectedEmployee(employee)
        setOpenEditEmployeeForm(true)
    }

    function handleOpenDeleteModal(employee) {
        setSelectedEmployee(employee)
        setOpenDeleteModal(true)
    }

    function handleOpenActivateModal(employee) {
        setSelectedEmployee(employee)
        setOpenActivateModal(true)
    }

    function handleCloseEditEmployeeForm() {
        setOpenEditEmployeeForm(false)
        setSelectedEmployee(null)
    }

    function handleCloseDeleteModal() {
        setOpenDeleteModal(false)
        setSelectedEmployee(null)
        setDeleteLoading(false)
    }

    function handleCloseActivateModal() {
        setOpenActivateModal(false)
        setSelectedEmployee(null)
        setActivateLoading(false)
    }

    const handleDeleteEmployee = async () => {
        if (!selectedEmployee) return;
        
        setDeleteLoading(true);
        
        try {
            await deleteEmployee(selectedEmployee.id);
            refetch();
            handleCloseDeleteModal();
 
        } catch (err) {
            console.error('Ошибка при удалении сотрудника:', err);
        } finally {
            setDeleteLoading(false);
        }
    }

    const handleActivateEmployee = async () => {
        if (!selectedEmployee) return;
        
        setActivateLoading(true);
        
        try {
            await activateEmployee(selectedEmployee.id);
            refetch();
            handleCloseActivateModal();
        } catch (err) {
            console.error('Ошибка при активации сотрудника:', err);
        } finally {
            setActivateLoading(false);
        }
    }

    const applyFilters = () => {
        const filters = {}
        if (searchTerm) filters.search = searchTerm
        if (departmentFilter) filters.department = departmentFilter
        if (sortBy) filters.ordering = sortBy
        if (showInactive) filters.showInactive = true
        
        refetch(filters)
    }

    const resetFilters = () => {
        setSearchTerm('')
        setDepartmentFilter('')
        setSortBy('last_name')
        setShowInactive(false)
        refetch()
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchTerm, departmentFilter, sortBy, showInactive])

    const employeeTableColumnsWithEdit = [
        ...employeeTableColumn,
        {
            key: "active",
            title: "Статус",
            cellClassName: "text-center",
            render: (_, row) => (
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    row.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {row.is_active ? 'Активен' : 'Неактивен'}
                </div>
            ) 
        },
        {
            key: "edit",
            title: "",
            cellClassName: "w-15 h-15 min-w-15 min-h-15",
            render: (_, row) => (
                <button
                    onClick={() => handleOpenEditEmployeeForm(row)}
                    className="cursor-pointer text-gray-200 hover:text-white hover:scale-105 px-3 py-1"
                    title="Редактировать"
                    disabled={!row.is_active}
                >
                    <EditIcon />
                </button>
            ) 
        },
        {
            key: "actions",
            title: "Действия",
            cellClassName: "w-15 h-15 min-w-15 min-h-15",
            render: (_, row) => (
                <div className="flex gap-1">
                    {row.is_active ? (
                        <button
                            onClick={() => handleOpenDeleteModal(row)}
                            className="cursor-pointer text-gray-200 hover:text-red-500 hover:scale-105 px-3 py-1 transition-colors"
                            title="Деактивировать сотрудника"
                            disabled={deleteLoading}
                        >
                            <PersonRemoveIcon />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleOpenActivateModal(row)}
                            className="cursor-pointer text-gray-200 hover:text-green-500 hover:scale-105 px-3 py-1 transition-colors"
                            title="Активировать сотрудника"
                            disabled={activateLoading}
                        >
                            <CheckCircleIcon />
                        </button>
                    )}
                </div>
            ) 
        }
    ]

    const transformEmployeeData = (employees) => {
        return employees.map(employee => ({
            id: employee.id,
            full_name: employee.full_name || `${employee.last_name} ${employee.first_name}`,
            role: employee.role_name,
            department: employee.department,
            email: employee.email,
            phone_number: employee.phone_number,
            employment_date: employee.employment_date ? 
                new Date(employee.employment_date).toLocaleDateString('ru-RU') : '-',
            avatar_url: employee.avatar_url,
            is_active: employee.is_status,
            ...employee
        }))
    }

    const stats = useMemo(() => {
        const active = employees.filter(emp => emp.is_active).length;
        const inactive = employees.filter(emp => !emp.is_active).length;
        return { active, inactive, total: employees.length };
    }, [employees]);

    return (
        <>
            {openAddEmployeeForm &&
                <AddEmployeeForm 
                isOpen={openAddEmployeeForm}
                onClose={() => setOpenAddEmployeeForm(false)}
                onSuccess={() => refetch()}
            />
            }
            
            {openEditEmployeeForm && selectedEmployee && (
                <EditEmployeeForm 
                    isOpen={openEditEmployeeForm}
                    onClose={handleCloseEditEmployeeForm}
                    employee={selectedEmployee}
                    onSuccess={() => refetch()}
                />
            )}
            
            {openDeleteModal &&
                <ConfirmModal
                isOpen={openDeleteModal}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteEmployee}
                title="Удаление сотрудника"
                message={selectedEmployee ? `Вы уверены, что хотите удалить сотрудника ${selectedEmployee.first_name} ${selectedEmployee.last_name}? Это действие нельзя отменить.` : "Вы уверены, что хотите удалить этого сотрудника?"}
                confirmText="Удалить"
                cancelText="Отмена"
                loading={deleteLoading}
            />
            }

            {openActivateModal &&
                <ConfirmModal
                    isOpen={openActivateModal}
                    onClose={handleCloseActivateModal}
                    onConfirm={handleActivateEmployee}
                    title="Активация сотрудника"
                    message={selectedEmployee ? `Вы уверены, что хотите активировать сотрудника ${selectedEmployee.first_name} ${selectedEmployee.last_name}? Он снова сможет войти в систему.` : "Вы уверены, что хотите активировать этого сотрудника?"}
                    confirmText="Активировать"
                    cancelText="Отмена"
                    loading={activateLoading}
                />
            }

            <MainLayout>
                {/* Панель управления */}
                <div className="mb-6 space-y-4">
                    {/* Кнопки действий */}
                    <div className="flex justify-between items-center">
                        <div className='flex gap-3 w-[500px]'>
                            <Button bgColor="#407E41" onClick={handleOpenAddEmployeeForm}>
                                <PersonAddIcon className="mr-1" />
                                Добавить сотрудника
                            </Button>

                            <Button 
                                bgColor={showInactive ? "#7C3AED" : "#6B7280"}
                                onClick={() => setShowInactive(!showInactive)}
                            >
                                {showInactive ? (
                                    <>
                                        <VisibilityOff className="mr-1" />
                                        Скрыть неактивных
                                    </>
                                ) : (
                                    <>
                                        <Visibility className="mr-1" />
                                        Показать неактивных
                                    </>
                                )}
                            </Button>

                        </div>
                        
                        <div className="flex items-center gap-3">
                            {loading && <CircularProgress size={20} />}
                            
                            <Button 
                                bgColor="#2D3748" 
                                onClick={() => refetch()}
                                disabled={loading}
                            >
                                <RefreshIcon className="mr-1" />
                                Обновить
                            </Button>
                        </div>
                    </div>

                    {/* Фильтры и поиск */}
                    <div className="bg-transparent p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                            <FilterListIcon/>
                            <span className="font-medium">Фильтры и поиск</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Поиск */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Поиск
                                </label>
                                <SearchInput
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    placeholder="Поиск по имени, фамилии, email..."
                                />
                            </div>

                            {/* Фильтр по отделу */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Отдел
                                </label>
                                <SelectFilter
                                    value={departmentFilter}
                                    onChange={setDepartmentFilter}
                                    options={departments}
                                    placeholder="Все отделы"
                                />
                            </div>

                            {/* Сортировка */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <SortIcon className="mr-1 inline" />
                                    Сортировка
                                </label>
                                <SelectFilter
                                    value={sortBy}
                                    onChange={setSortBy}
                                    options={sortOptions}
                                    placeholder="Сортировка..."
                                />
                            </div>
                        </div>

                        {/* Кнопка сброса фильтров */}
                        {(searchTerm || departmentFilter || sortBy !== 'last_name') && (
                            <div className="mt-3 flex justify-end">
                                <Button
                                    bgColor="#6B7280"
                                    onClick={resetFilters}
                                    size="s"
                                >
                                    Сбросить фильтры
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                    <div className="bg-red-500 text-white p-3 rounded mb-4">
                        Ошибка: {error}
                    </div>
                )}

                {/* Таблица */}
                {loading && employees.length === 0 ? (
                    <div className="flex justify-center items-center py-10">
                        <CircularProgress size={40} />
                        <span className="ml-3">Загрузка сотрудников...</span>
                    </div>
                ) : (
                    <DataTable 
                        data={transformEmployeeData(employees)} 
                        column={employeeTableColumnsWithEdit} 
                    />
                )}

                {/* Сообщение если нет сотрудников */}
                {!loading && employees.length === 0 && !error && (
                    <div className="text-center py-10 text-gray-500">
                        {searchTerm || departmentFilter ? 'Нет сотрудников, соответствующих фильтрам' : 'Нет данных о сотрудниках'}
                    </div>
                )}
            </MainLayout>
        </>
    )
}

export default EmployeesPage