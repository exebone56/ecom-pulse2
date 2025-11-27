import { useState } from 'react';

const CollapsibleBlock = ({ title, children, bgColor }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden border-2 rounded-lg ">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left font-medium flex justify-between items-center cursor-pointer rounded-t-md border-3 border-transparent hover:border-white"
        style={{backgroundColor: bgColor}}
      >
        <span className='uppercase font-black text-2xl'>{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      <div className={`transition-all duration-300 ${isOpen ? 'max-h-screen' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 border-t" style={{backgroundColor: bgColor}}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleBlock;
