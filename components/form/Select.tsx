import React from "react";

interface Option {
  value: string;
  label: string | null;
}

interface SelectProps {
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

type Props = SelectProps
const Select = React.forwardRef<HTMLSelectElement, Props>(
  ({
    placeholder,
    options,
    className = "",
    defaultValue = "",
    disabled = false,
    ...props
  }, ref) => {
    return (
      <select
        defaultValue={defaultValue}
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300  px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${"text-gray-400 dark:text-gray-400"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        <option
          value=""
          disabled
          hidden
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = "Select";

export default Select;
