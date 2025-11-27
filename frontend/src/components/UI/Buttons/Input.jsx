const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  name, // ← ДОБАВИТЬ
  id, // ← ДОБАВИТЬ
  label, // ← ДОБАВИТЬ (если нужны лейблы)
  disabled = false, // ← ДОБАВИТЬ
  className = "" // ← ДОБАВИТЬ для кастомных классов
}) => {
  // Генерируем id если не передан
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {/* Лейбл если передан */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name} // ← ВАЖНО: для доступа через e.target.name
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full p-3 rounded-lg bg-white/5 border border-white/10 
          text-white placeholder-gray-400 
          focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 
          transition-all duration-300 placeholder:text-[14px]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
    </div>
  )
}

export default Input