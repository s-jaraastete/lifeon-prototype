"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { LuChevronDown } from 'react-icons/lu';

type Option = {
  value: string
  label: string
  subLabel?: string
};

type Props = {
  value?: string
  onValueChange?: (value: string) => void
  options: Option[]
  label?: string
};

const SelectSuscription = ({ value, onValueChange, options, label }: Props) => {
  const selected = options.find((o) => o.value === value) ?? options[0];

  const handleChange = (option: Option) => {
    onValueChange?.(option.value)
  };

  return (
    <div className="relative flex flex-col mb-5">
      {label && (
        <label className="block font-medium mb-2">{label}</label>
      )}
      <Listbox
        value={selected}
        onChange={handleChange}
      >
        <ListboxButton className="appearance-none w-full py-3 px-5 leading-normal cursor-pointer transition duration-200 focus:ring-1 focus:ring-primary focus:outline-none rounded-xl ring-1 ring-gray-400 flex items-center justify-between gap-2">
          <span className="text-left">{selected.label}</span>
          <LuChevronDown className="w-5 h-5 text-gray-700 shrink-0" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom"
          className="mt-1 rounded-xl bg-white ring-1 ring-gray-400 w-(--button-width)"
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
      </Listbox>
    </div>
  )
}

export default SelectSuscription;