"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import { LuChevronDown } from 'react-icons/lu'

type Props = {
  value?: string
  onValueChange?: (value: string) => void
}

const plans = [
  { value: 'plan-mensual', label: 'Suscripción mensual' },
  { value: 'plan-anual', label: 'Suscripción anual' },
]

const SelectSuscription = ({ value, onValueChange }: Props) => {
  const selected = plans.find((p) => p.value === value) ?? plans[0]

  const handleChange = (plan: { value: string; label: string }) => {
    onValueChange?.(plan.value)
  }

  return (
    <div className="relative flex flex-col mb-5">
      <label className="block font-medium mb-2">Suscripción</label>
      <Listbox value={selected} onChange={handleChange}>
        <ListboxButton className="appearance-none w-full py-3 px-5 leading-normal transition duration-200 focus:ring-1 focus:ring-primary focus:outline-none rounded-xl ring-1 ring-gray-400 flex items-center justify-between gap-2">
          <span className="text-left">{selected.label}</span>
          <LuChevronDown className="w-5 h-5 text-gray-700 shrink-0" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom"
          className="mt-1 rounded-xl bg-white ring-1 ring-gray-400 shadow-lg w-(--button-width)"
        >
          {plans.map((plan) => (
            <ListboxOption
              key={plan.value}
              value={plan}
              className="py-3 px-5 cursor-pointer data-focus:bg-gray-100"
            >
              {plan.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  )
}

export default SelectSuscription;