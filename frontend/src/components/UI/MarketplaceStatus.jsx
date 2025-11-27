import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorIcon from '@mui/icons-material/Error';

const MarketplaceStatus = ({ marketplace }) => {
    if (!marketplace) {
        return (
            <div className="flex justify-center" title="Не размещен">
                <CancelIcon className="text-gray-400 text-lg" />
            </div>
        );
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case 'ACTIVE':
                return { 
                    icon: <CheckCircleIcon className="text-green-500 text-lg" />, 
                    title: 'Активный'
                };
            case 'INACTIVE':
                return { 
                    icon: <CancelIcon className="text-red-500 text-lg" />, 
                    title: 'Неактивный'
                };
            case 'MODERATION':
                return { 
                    icon: <SyncIcon className="text-blue-500 text-lg animate-spin" />, 
                    title: 'На модерации'
                };
            case 'DRAFT':
                return { 
                    icon: <CancelIcon className="text-gray-400 text-lg" />, 
                    title: 'Черновик'
                };
            case 'REJECTED':
                return { 
                    icon: <ErrorIcon className="text-orange-500 text-lg" />, 
                    title: 'Отклонен'
                };
            case 'ARCHIVED':
                return { 
                    icon: <CancelIcon className="text-gray-400 text-lg" />, 
                    title: 'В архиве'
                };
            default:
                return { 
                    icon: <CancelIcon className="text-gray-400 text-lg" />, 
                    title: `Неизвестно (${status})`
                };
        }
    };

    const statusInfo = getStatusInfo(marketplace.status);
    
    const lastSyncText = marketplace.last_sync 
        ? `\nПоследняя синхронизация: ${new Date(marketplace.last_sync).toLocaleDateString('ru-RU')}`
        : '\nСинхронизации не было';

    const tooltipText = `${statusInfo.title}${lastSyncText}\nExternal SKU: ${marketplace.external_sku || 'не указан'}`;

    return (
        <div className="flex flex-col items-center" title={tooltipText}>
            {statusInfo.icon}
            {marketplace.external_sku && (
                <span className="text-xs text-gray-400 mt-1">
                    {marketplace.external_sku}
                </span>
            )}
        </div>
    );
};

export default MarketplaceStatus;