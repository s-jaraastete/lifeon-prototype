"use client";

import {
  Listbox as HListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { LuChevronDown } from "react-icons/lu";

type Option = {
  value: string;
  label: string;
  subLabel?: string;
};

type ListboxProps = {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onFocus?: () => void;
  options: Option[];
  label?: string;
  placeholder?: string;
  error?: string;
};

const Listbox = ({
  id,
  value,
  onValueChange,
  onFocus,
  options,
  label,
  placeholder,
  error,
}: ListboxProps) => {
  const selected = options.find((o) => o.value === value) ?? null;

  const handleChange = (option: Option | null) => {
    onValueChange?.(option?.value ?? "");
  };

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <label
          htmlFor={id}
          className="text-lg font-medium leading-6"
        >
          {label}
        </label>
      )}
      <HListbox
        value={selected}
        onChange={handleChange}
      >
        {({ open }) => (
          <>
            <ListboxButton
              id={id}
              onFocus={onFocus}
              className={`
                appearance-none w-full py-3 px-5 leading-normal cursor-pointer
                transition duration-200 focus:ring-1 focus:outline-none
                rounded-xl ring-1 flex items-center justify-between gap-2
                ${error ? "ring-primary focus:ring-primary" : "ring-gray-400 focus:ring-gray-600"}
              `}
            >
              <span className={`text-left ${selected ? "" : "text-gray-700"}`}>
                {selected ? selected.label : (placeholder ?? "Seleccione")}
              </span>
              <LuChevronDown className="w-5 h-5 text-gray-700 shrink-0" />
            </ListboxButton>
            <Transition
              show={open}
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="transition duration-150 ease-in"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-2"
            >
              <ListboxOptions
                anchor="bottom"
                className="mt-1 rounded-xl bg-white outline-0 ring-1 ring-gray-400 focus-visible:ring-gray-600 w-(--button-width)"
              >
                {options.map((option) => (
                  <ListboxOption
                    key={option.value}
                    value={option}
                    className="py-3 px-5 cursor-pointer data-focus:bg-gray-200 flex flex-col items-start gap-0.5"
                  >
                    <span className="text-black text-base">{option.label}</span>
                    {option.subLabel && (
                      <span className="text-xs font-medium text-secondary leading-5">
                        {option.subLabel}
                      </span>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </>
        )}
      </HListbox>
      {error && <p className="text-sm text-primary leading-tight">{error}</p>}
    </div>
  );
};

export default Listbox;
