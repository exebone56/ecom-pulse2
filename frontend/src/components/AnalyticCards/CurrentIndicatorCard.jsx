import React from 'react'

const CurrentIndicatorCard = ({data, title, icon, color}) => {
  return (
    <div className='p-[10px] w-[175px] min-h-[200px] bg-[#2B2B36] rounded-xl border-2 border-white/40 flex flex-col gap-y-[8px]'>
        <div className>{icon}</div>
        <span className='font-semibold text-4xl'>{data}</span>
        <h4 className='text-[16px] font-light'>{title}</h4>
    </div>
  )
}

export default CurrentIndicatorCard