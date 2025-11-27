import { useState } from "react"
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const EditableCell = ({value, onSave, className}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex gap-2">
                <input 
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="w-20 px-1 py-0.5 border border-blue-500 rounded bg-gray-800 text-white text-center"
                    autoFocus
                />
                <div className="div">
                    <button
                        onClick={handleSave}
                        className="text-green-500 text p-2 cursor-pointer"
                    >
                        <SaveIcon />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="text-red-500 text-xs p-2 cursor-pointer"
                    >
                        <CancelIcon />
                    </button>
                </div>
                
            </div>
        )
    }
  return (
    <div 
        onClick={() => setIsEditing(true)}
        className={`${className} cursor-pointer hover:bg-gray-700 transition-colors`}
    >
        {editValue}
    </div>
  )
}

export default EditableCell