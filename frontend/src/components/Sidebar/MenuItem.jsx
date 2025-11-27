import { Link, useLocation } from 'react-router-dom'
import { iconMapping } from '../../data/menuItems'
import { useMenu }  from '../contexts/MenuContext'
const MenuItem = ({menuItem, open}) => {
    const location = useLocation();
    const { toggleMenu, isMenuOpen} = useMenu();

    const handleClick = (e) => {
        if (menuItem.hasSubmenu) {
        e.preventDefault();
        
        const hasActiveSubItem = menuItem.subItems?.some(
            subItem => location.pathname === subItem.link
        );
        
        if (hasActiveSubItem && isSubmenuOpen) {
            toggleMenu(menuItem.id);
        } else {
            toggleMenu(menuItem.id);
        }
    }
    };

    const isSubmenuOpen = isMenuOpen(menuItem.id)
    const isActive = location.pathname.startsWith(menuItem.link);
    const IconComponent = iconMapping[menuItem.icon];

  return (
    <div>
            <Link 
                to={menuItem.link}
                className="flex items-center w-full"
                onClick={handleClick}
            >   
                <li 
                    className={`flex items-center cursor-pointer hover:bg-accent p-3 mb-2 rounded-sm text-xl overflow-hidden w-full ${
                        isActive && "bg-accent border-r-2 border-white"
                    }`}
                    key={menuItem.id}
                > 
                    <IconComponent/>
                    <span className={`${open ? 'opacity-100 w-auto' : 'opacity-0 w-0'} whitespace-nowrap text-ellipsis sidebar__text pl-2`}>
                        {menuItem.title}
                    </span>
                    {menuItem.hasSubmenu && open && (
                        <span className={`ml-auto transform transition-transform text-sm ${
                            isSubmenuOpen ? 'rotate-90' : ''
                        }`}>
                            ▶
                        </span>
                    )}
                </li>
            </Link>

            {/* Подпункты */}
            {menuItem.hasSubmenu && isSubmenuOpen && open && (
                <div className="ml-4 border-l-2 border-gray-600 transition-all duration-300">
                    {menuItem.subItems.map((subItem) => {
                        const SubIconComponent = iconMapping[subItem.icon];
                        const isSubActive = location.pathname === subItem.link;
                        
                        return (
                            <Link 
                                to={subItem.link}
                                key={subItem.id}
                                className="flex items-center w-full"
                            >
                                <li 
                                    className={`flex items-center cursor-pointer hover:bg-accent p-2 mb-1 rounded-sm text-lg overflow-hidden w-full ${
                                        isSubActive && "bg-accent"
                                    }`}
                                >
                                    <SubIconComponent className="text-lg"/>
                                    <span className="whitespace-nowrap text-ellipsis sidebar__text pl-2">
                                        {subItem.title}
                                    </span>
                                </li>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
  );
};

export default MenuItem