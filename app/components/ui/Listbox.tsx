"use client";

import {
  Listbox as HListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { LuChevronDown } from "react-icons/lu";
import clsx from "clsx";

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
              className={clsx(
                "input-base input-ring input-focus",
                "cursor-pointer flex items-center justify-between gap-2 leading-normal",
                open && "ring-2 ring-secondary",
                error && "input-error",
              )}
            >
              <span className={clsx("text-left truncate min-w-0", selected ? "" : "text-gray-700")}>
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
                className={clsx(
                  "input-ring mt-1 rounded-xl bg-white outline-0",
                  "w-(--button-width) max-h-60! overflow-y-auto",
                  "focus-visible:ring-gray-600",
                  "[&::-webkit-scrollbar]:w-3",
                  "[&::-webkit-scrollbar-track]:my-1.5",
                  "[&::-webkit-scrollbar-thumb]:rounded-full",
                  "[&::-webkit-scrollbar-thumb]:bg-gray-500",
                  "[&::-webkit-scrollbar-thumb]:border-2",
                  "[&::-webkit-scrollbar-thumb]:border-solid",
                  "[&::-webkit-scrollbar-thumb]:border-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-clip-padding",
                )}
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
