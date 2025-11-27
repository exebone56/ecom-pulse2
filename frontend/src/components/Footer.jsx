import React from 'react'

const Footer = () => {
  return (
    <footer className='bg-dark h-[50px] flex items-center px-4'>
        <div className='text-gray-600 text-[12px] w-full flex justify-between'>
            <div>
                v.0.0.1
            </div>
            <div>©2025 ECOM-PULSE CRM | Поддержка: <a href='mailto:support@ecom-pulse.ru'>support@ecom-pulse.ru</a></div>
        </div>
    </footer>
  )
}

export default Footer