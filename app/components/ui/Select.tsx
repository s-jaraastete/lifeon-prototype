"use client"

import { LuChevronDown } from "react-icons/lu";
import { SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  className?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  error?: string;
}

const Select = ({
	label,
	className,
	placeholder = "Seleccione",
	children,
	onChange,
	onValueChange,
	error,
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
          className={clsx(
            "input-base input-ring input-focus input-disabled leading-normal",
            error && "input-error",
            !selectProps.value && "text-gray-700",
            className,
          )}
          aria-invalid={!!error || undefined}
          onChange={handleChange}
          {...selectProps}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <LuChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
      </div>
      {error && (
        <p className="text-sm text-primary leading-tight">{error}</p>
      )}
    </div>
  );
};

export default Select;
