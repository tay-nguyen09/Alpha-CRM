import { useClickOutside } from "@/hooks/useClickOutside";
import React, { useMemo, useState } from "react";

interface Option {
  value: string;
  text: string;
  selected?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  label?: string;
  value: string[];                    // ✅ controlled
  onChange: (selected: string[]) => void; // ✅ controlled
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Select option",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const selectedOptions = React.useMemo(() => value ?? [], [value]);
  const availableOptions = useMemo(
    () => options.filter((o) => !selectedOptions.includes(o.value)),
    [options, selectedOptions]
  );

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const next = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue];

    onChange(next);
  };

  const removeOption = (_index: number, optionValue: string) => {
    if (disabled) return;
    const next = selectedOptions.filter((v) => v !== optionValue);
    onChange(next);
  };

  const selectedValuesText = useMemo(
    () =>
      selectedOptions.map(
        (v) => options.find((o) => o.value === v)?.text || ""
      ),
    [selectedOptions, options]
  );
  useClickOutside(boxRef, () => setIsOpen(false))

  const topDisabledClass = disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"

  return (
    <div className={`w-full ${className} ${disabled ? "pointer-events-auto" : ""}`} >
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div
            onClick={toggleDropdown}
            className={`w-full ${topDisabledClass}`}
            onBlur={onBlur}
            tabIndex={0}
          >
            <div className="flex rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-wrap flex-auto gap-2 ">
                {selectedValuesText.length > 0 ? (
                  selectedValuesText.map((text, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1.5 p-3 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                    >
                      <span className="flex-initial max-w-full">{text}</span>
                      {
                        !disabled && <div className="flex flex-row-reverse flex-auto">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOption(index, selectedOptions[index]);
                            }}
                            className="pl-2 text-gray-500 cursor-pointer group-hover:text-gray-400 dark:text-gray-400"
                          >
                            ✕
                          </div>
                        </div>
                      }

                    </div>
                  ))
                ) : (
                  <input
                    placeholder={placeholder}
                    className="w-full h-full p-1 pr-2 text-sm bg-transparent border-0 outline-hidden appearance-none placeholder:text-gray-800 focus:border-0 focus:outline-hidden focus:ring-0 dark:placeholder:text-white/90 capitalize"
                    readOnly
                    value=""
                  />
                )}
              </div>

              <div className="flex items-center py-1 pl-1 pr-1 w-7">
                <button
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  className={`w-5 h-5 text-gray-700 outline-hidden focus:outline-hidden dark:text-gray-400 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg
                    className={`stroke-current ${isOpen ? "rotate-180" : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              ref={boxRef}
              className="mt-1 absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg shadow-sm top-full max-h-select dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {availableOptions.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Không có lựa chọn nào</div>
                ) : (
                  availableOptions.map((option, index) => {
                    const active = selectedOptions.includes(option.value);
                    return (
                      <div
                        key={index}
                        className="w-full cursor-pointer border-b border-gray-200 dark:border-gray-800 hover:bg-primary/5"
                        onClick={() => handleSelect(option.value)}
                      >
                        <div
                          className={`relative flex w-full items-center p-2 pl-2 ${active ? "bg-primary/10" : ""}`}
                        >
                          <div className="mx-2 leading-6 text-gray-800 dark:text-white/90">
                            {option.text}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
