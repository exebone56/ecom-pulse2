import { useState } from 'react'
import { menuItems } from '../data/menuItems'
import LogoIcon from './Icons/LogoIcon'
import Button from './UI/Buttons/Button'
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import MenuItem from './Sidebar/MenuItem'
const Sidebar = ({navHeader}) => {
    const [open, setOpen] = useState(true);

    function openMenu() {
        setOpen(!open);
    }

  return (
    <nav className={`${open ? 'w-64' : 'w-18'} bg-dark py-2 px-1 h-screen sidebar md:px-3 flex flex-col sticky top-0 overflow-hidden`}>
        <div className="absolute w-full h-full bg-transparent top-0 left-0 border-r-2 z-30 rounded-xl border-white/55"></div>
        <header className='flex justify-between items-center pr-10 z-40 sticky top-0 shrink-0'>
            <div className='flex items-center gap-x-1 flex-1'>
                 <LogoIcon color="text-[#B32222]" size={"s"}/>
                <h3 className={`${open ? 'opacity-100 w-auto' : 'opacity-0 w-0'} transition-opacity duration-100 delay-150 text-[14px] overflow-hidden whitespace-nowrap`}>{navHeader}</h3>
            </div>
        </header>
        <div className="flex flex-col flex-1 pt-6 z-40 sticky">
            <ul className='flex-col flex-1 overflow-auto'>
                {menuItems.map((menuItem) => (
                    <MenuItem
                        key={menuItem.id}
                        menuItem={menuItem}
                        open={open}
                    />
                ))}
            </ul>
            <div className="flex shrink-0 border-t border-gray-600 mt-auto"><Button fontSize="12px" onClick={openMenu}><span className={`${open && "rotate-180"}`}><ArrowRightIcon /></span></Button></div>
        </div>
    </nav>
  )
}

export default Sidebar