import React from 'react'
import CloseIcon from '@mui/icons-material/Close';
const Modal = ({children, onClose, headerForm}) => {

  return (
    <div className='fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center z-50'>
        <div class="bg-background p-6 shadow-xl shadow-white/5 border-2 border-white/25 w-[full] h-full max-h-screen rounded-none md:w-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-xl">
            <div className="flex justify-end items-center">
                <button
                    onClick={onClose}
                    className='flex justify-center items-center text-accent/75 cursor-pointer border-2 border-transparent w-7 h-7 rounded-full hover:scale-110 hover:border-accent hover:text-accent'
                ><CloseIcon />
                </button>
            </div>
            <div className="text-2xl font-bold pb-3">{headerForm}</div>
            {children}
        </div>
    </div>
  )
}

export default Modal