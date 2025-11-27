import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import InventoryIcon from '@mui/icons-material/Inventory';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import ChecklistIcon from '@mui/icons-material/Checklist';

export const iconMapping = {
  LeaderboardIcon: LeaderboardIcon,
  WarehouseIcon: WarehouseIcon, 
  InventoryIcon: InventoryIcon,
  StickyNote2Icon: StickyNote2Icon,
  PersonIcon: PersonIcon,
  AttachMoneyIcon: AttachMoneyIcon,
  MoveDownIcon: MoveDownIcon,
  MoveUpIcon: MoveUpIcon,
  ChecklistIcon: ChecklistIcon,
}

export const menuItems = [
    {
        id: 1,
        title: "Дашборд",
        link: "/dashboard",
        icon: "LeaderboardIcon",
        isActive: true,
    },
    {
        id: 2,
        title: "Заказы",
        link: "/orders",
        icon: "AttachMoneyIcon",
        isActive: true,
    },
    {
        id: 3,
        title: "Товары",
        link: "/products",
        icon: "InventoryIcon",
        isActive: true,
    },
    {
        id: 4,
        title: "Складской учет",
        link: "/warehouse",
        icon: "WarehouseIcon",
        isActive: true,
        hasSubmenu: true,
        subItems: [
            {
                id: 4.1,
                title: "Остатки",
                link: "/warehouse/stock",
                icon: "InventoryIcon",
            },
            {
                id: 4.2,
                title: "Документы",
                link: "/warehouse/documents",
                icon: "MoveDownIcon",
            },
        ]
    },
    {
        id: 5,
        title: "Сотрудники",
        link: "/employees",
        icon: "PersonIcon",
        isActive: true,
    },

]