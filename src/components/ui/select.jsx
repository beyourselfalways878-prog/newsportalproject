import React, { useState, useRef, useEffect } from 'react';

const SelectContext = React.createContext();

const Select = ({ children, onValueChange, defaultValue, value: controlledValue }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, open, setOpen, handleValueChange }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-11 sm:h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation ${className}`}
      {...props}
    >
      {children}
      <svg className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 9l5 5 5-5" />
      </svg>
    </button>
  );
};

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ children, className = '' }) => {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <div className={`absolute top-full left-0 right-0 z-[9999] mt-1 min-w-[8rem] max-h-[60vh] overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-gray-900 dark:text-white shadow-xl overscroll-contain ${className}`}>
      {children}
    </div>
  );
};

const SelectItem = ({ children, value }) => {
  const { handleValueChange, value: currentValue } = React.useContext(SelectContext);
  const isSelected = currentValue === value;
  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-md py-3 px-3 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 touch-manipulation ${isSelected ? 'bg-primary/10 text-primary font-medium' : ''}`}
      onClick={() => handleValueChange(value)}
    >
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
