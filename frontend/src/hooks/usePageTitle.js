import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();
  
  const pageTitles = {
    '/dashboard': 'Дашборд',
    '/orders': 'Заказы',
    '/products': 'Товары',
    '/warehouse': 'Складской учет',
    '/warehouse/stock': 'Остатки на складе',
    '/warehouse/incoming': 'Поступления',
    '/warehouse/writeoff': 'Списания',
    '/warehouse/inventory': 'Инвентаризация',
    '/documents': 'Документы',
    '/employees': 'Сотрудники',
  };
  
  const exactTitle = pageTitles[location.pathname];
  if (exactTitle) return exactTitle;
  
  const matchingPath = Object.keys(pageTitles).find(path => 
    location.pathname.startsWith(path)
  );
  
  return matchingPath ? pageTitles[matchingPath] : 'CRM Система';
};