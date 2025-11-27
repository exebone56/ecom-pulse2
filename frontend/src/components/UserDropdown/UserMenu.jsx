import React from 'react'
import { actionMapping, userMenuItems } from '../../data/userMenuItems'
import { iconMapping } from '../../data/userMenuItems'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const UserMenu = React.forwardRef(({className="", onOpenUserSettingsModal}, ref) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

   const handleAction = (action) => {
        if (action === 'logout') {
            actionMapping[action](logout, navigate);
        }
        if (action === 'openSettings') {
            onOpenUserSettingsModal();
        }
    };
  return (
    <div ref={ref} className={`w-40 bg-[#C02C2C] rounded-xl border-t-2 border-b-2 shadow-xl shadow-black/25 border-white p-2 z-50 ${className}`}>
      <div className='flex flex-col gap-y-2'>
        {userMenuItems.map((item) => {
          const IconComponent = iconMapping[item.icon]
          return (
            <button
              key={item.action}
              onClick={() => handleAction(item.action)}
              className='bg-[#A41D1D]/80 p-2 rounded-md border-2 border-transparent cursor-pointer hover:border-white flex items-center gap-x-1'
            >
            <IconComponent />
            {item.title}
          </button>
          )
        })}
      </div>
      
    </div>
  )
})

export default UserMenu