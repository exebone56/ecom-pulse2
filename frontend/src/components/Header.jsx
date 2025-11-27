import { useState, useRef, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import NotificationsIcon from '@mui/icons-material/Notifications';
import UserMenu from "./UserDropdown/UserMenu";
import { useAuth } from "./contexts/AuthContext";
import UserSettingsModal from "./Modals/UserSettingsModal";

const Header = () => {
    const [isOpenUserSettingsModal, setIsOpenUserSettingsModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { user } = useAuth();

    const handleUserUpdate = (updatedUser) => {
        setCurrentUser(updatedUser);
    
    };

    const pageTitle = usePageTitle();

    
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const actualUser = currentUser || user;

    const [open, setOpen] = useState(false);

    function openMenu() {
        setOpen(!open);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {

            if (!open) return 

            if (menuRef.current && buttonRef.current) {
                const isMenuClick = menuRef.current.contains(event.target)
                const isButtonClick = buttonRef.current.contains(event.target)

                if (!isMenuClick && !isButtonClick) {
                    setOpen(false)
                }
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    },[open])

  return (
    <header
        className="bg-dark flex items-center justify-between gap-x-3 px-3 py-2 z-40 sticky top-0 shadow-[0_2px_10px_-2px_rgba(255,255,255,0.2)]"

    >   
        <h1 className="text-sm font-bold text-white/75 uppercase">{pageTitle}</h1>
        <div className="flex gap-x-4 items-center roudned-xl">
            <NotificationsIcon />
            <div className="w-[50px] h-[50px] rounded-full">
                <img className="w-full h-full rounded-full object-cover" src={actualUser.avatar_url} />
            </div>
            <span className="hidden md:block">{actualUser.first_name} {actualUser.last_name[0]}.</span>
            <button
                ref={buttonRef}
                onClick={openMenu}
                className={`cursor-pointer p-1 ${open ? "text-accent hover:text-white rotate-180" : "text-current hover:text-accent"} transition-all duration-300`}
            >
                <ArrowDropDownIcon/>
            </button>
        </div>
        {open && <UserMenu onOpenUserSettingsModal={() => setIsOpenUserSettingsModal(true)} ref={menuRef} className="absolute top-full right-2 bottom[-2px]" />}
        {isOpenUserSettingsModal && 
            <UserSettingsModal
                user={actualUser}
                onUserUpdate={handleUserUpdate}
                onClose={() => setIsOpenUserSettingsModal(false)}
            />
            }
    </header>
    
  )
}

export default Header