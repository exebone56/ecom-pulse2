import React from 'react'
import cn from 'classnames'

const AnalyticBlock = ({title, subtitle, children, extraClasses}) => {
  return (
    <div className={cn(
        'flex flex-col rounded-xl p-3 bg-dark border-2 border-white/25 shadow shadow-black/25 md:p-5 overflow-hidden', extraClasses)}>
        <header className='mb-3'>
            <div className="flex flex-col">
                {<h3 className='md:text-2xl'>{title}</h3>}
                {subtitle && <span className='text-[12px] text-white/75'>{subtitle}</span>}
            </div>
        </header>
        {children}
    </div>
  )
}

export default AnalyticBlock