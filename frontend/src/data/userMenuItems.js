import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';

export const iconMapping = {
  LogoutIcon: LogoutIcon,
  SettingsIcon: SettingsIcon,
  HelpIcon: HelpIcon
}

export const actionMapping = {
    openSettings: () => {
        console.log('Открываем настройки');
        // navigate('/settings');
    },
    openHelp: () => {
        console.log('Открываем помощь'); 
        // navigate('/help');
    },
    logout: (logout, navigate) => {
        logout();
        navigate('/login');
    }
}

export const userMenuItems = [
    {
    id: 1,
    title: "Настройки",
    action: "openSettings",
    icon: "SettingsIcon",
    },
    {
    id: 2,
    title: "Помощь",
    action: "openHelp",
    icon: "HelpIcon"
    },
    {
    id: 3,
    title: "Выйти",
    action: "logout",
    icon: "LogoutIcon",
    },

]