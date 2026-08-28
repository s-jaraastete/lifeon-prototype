'use client'

import { Checkbox as HeadlessCheckbox, Field, Label as HeadlessLabel } from '@headlessui/react'
import { CheckIcon, MinusIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'

type CheckboxProps = {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
}

const Checkbox = (props: CheckboxProps) => {
  return (
    <Field className='flex items-start gap-2 group cursor-pointer'>
      <HeadlessCheckbox
        checked={props.checked}
        indeterminate={props.indeterminate}
        onChange={props.onChange}
        disabled={props.disabled}
        className={clsx(
          'mt-0.5 group size-4.5 shrink-0 rounded border bg-white transition duration-100',
          'data-checked:bg-primary-600 data-checked:border-primary-700/20',
          'data-indeterminate:bg-primary-600 data-indeterminate:border-primary-700/20',
          'group-hover:border-primary-600',
          'outline-none focus:outline-none data-focus:outline-none data-focus:ring-0 flex items-center justify-center',
          props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        {props.indeterminate ? (
          <MinusIcon className='size-3.5 text-white opacity-0 group-data-indeterminate:opacity-100' />
        ) : (
          <CheckIcon className='size-3.5 text-white opacity-0 group-data-checked:opacity-100' />
        )}
      </HeadlessCheckbox>
      {props.label !== undefined && (
        <HeadlessLabel
          className={clsx(
            'p mt-0 cursor-pointer select-none',
            props.disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {props.label}
        </HeadlessLabel>
      )}
    </Field>
  )
}

export default Checkbox
