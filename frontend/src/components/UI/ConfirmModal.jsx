import Modal from './Modal';
import Button from './Buttons/Button';

import WarningIcon from '@mui/icons-material/Warning';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Подтверждение удаления",
    message = "Вы уверены, что хотите удалить этого сотрудника?",
    confirmText = "Удалить",
    cancelText = "Отмена",
    loading = false 
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                        <WarningIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-lg font-medium white">
                            {title}
                        </h3>
                    </div>
                </div>
                
                <div className="mt-2">
                    <p className="text-sm text-gray-500">
                        {message}
                    </p>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                    <Button
                        type="button"
                        bgColor="#6B7280"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        bgColor="#DC2626"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : confirmText}
                    </Button>
                </div>
        </Modal>
    );
};

export default ConfirmModal;