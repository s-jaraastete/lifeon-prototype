"use client"

import { LuChevronDown } from "react-icons/lu";
import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  className?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

const Select = ({
	label,
	className,
	placeholder = "Seleccione",
	children,
	onChange,
	onValueChange,
	...selectProps
}: SelectProps) => {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <label
          htmlFor={selectProps.id}
          className="text-lg font-medium leading-6"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            appearance-none w-full py-3 px-5 leading-normal
            transition duration-200 focus:ring-1 focus:ring-primary focus:outline-none
            rounded-xl ring-1 ring-gray-400
            ${selectProps.value ? "" : "text-gray-700"}
            ${className ?? ""}
          `}
          onChange={handleChange}
          {...selectProps}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <LuChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
      </div>
    </div>
  );
};

export default Select;