import cn from "classnames"

const Button = ({size, onClick, children, fontSize, bgColor, hasIcon, icon, disabled, extraClasses="", type = "button", ...props}) => {
    const sizeClasses = {
        "xs": "w-[26px]",
        "s": "w-[110px] py-1",
        "m": "w-[130px] py-1",
        "l": "w-[150px] py-2",
    }
  return (
    <button 
        type={type}
        onClick={onClick}
        disabled={disabled} // ← Добавьте disabled
        style={{
          fontSize,
          backgroundColor: bgColor,
        }}
        className={cn(
          "w-full py-2 cursor-pointer border-2 border-transparent px-4 rounded-md flex justify-center items-center text-white hover:border-white", 
          disabled && "opacity-50 cursor-not-allowed hover:border-transparent", // ← Стили для disabled
          extraClasses
        )}
        {...props}
    >
        {children}
    </button>
  )
}

export default Button