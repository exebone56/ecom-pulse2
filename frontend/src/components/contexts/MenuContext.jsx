import { createContext, useContext, useState } from 'react';

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    const [openMenus, setOpenMenus] = useState(new Set());
    
    const toggleMenu = (menuId) => {
        setOpenMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    };
    
    const isMenuOpen = (menuId) => openMenus.has(menuId);
    
    return (
        <MenuContext.Provider value={{ toggleMenu, isMenuOpen }}>
            {children}
        </MenuContext.Provider>
    );
};


export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};