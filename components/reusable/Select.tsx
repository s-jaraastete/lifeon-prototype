"use client"

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import {CheckIcon, ChevronDownIcon, XMarkIcon} from "@heroicons/react/24/outline";
import clsx from 'clsx'
import { MouseEvent, ReactNode } from 'react';

type IDRequiredObjectInterface = {
  id: number | string
}

type SingleSelectProps<T extends IDRequiredObjectInterface> = {
  multiple?: never | false,
  selected: T | null,
  setSelected: (value: T | null) => void,
}

type MultipleSelectProps<T extends IDRequiredObjectInterface> = {
  multiple: true,
  selected: T[],
  setSelected: (value: T[]) => void,
}

type SelectProps<T extends IDRequiredObjectInterface> = (MultipleSelectProps<T> | SingleSelectProps<T>) & {
  items: T[],
  label: keyof T | ((value: T) => string),
  afterChange?: () => void,
  disabled?: boolean,
  item?: (value: T) => ReactNode,
}

const Select = <T extends IDRequiredObjectInterface, >(props: SelectProps<T>) => {

  const getItemLabel = (item: T) => (
    typeof props.label === 'function' ? props.label(item) : String(item[props.label ?? 'id'])
  )

  const hasSelection = props.multiple ? props.selected.length > 0 : props.selected !== null

  const handleChange = (newValue: typeof props.multiple extends true ? T[] : T | null) => {
    props.multiple ? props.setSelected(newValue as unknown as T[]) : props.setSelected(newValue)
    if (props.afterChange) {
      props.afterChange()
    }
    return
  }

  const handleClear = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (props.disabled) return
    if (props.multiple) {
      props.setSelected([])
    } else {
      props.setSelected(null)
    }
    props.afterChange?.()
  }

  return (
    <Listbox 
      value={props.selected as typeof props.multiple extends true ? T[] : (T | null)} 
      onChange={handleChange} 
      multiple={props.multiple} 
      disabled={props.disabled}
    >
      <ListboxButton
        as="div"
        className={clsx(
          'group relative flex w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3',
          'h-10 text-left text-body-md leading-6 text-gray-800 transition-colors',
          'hover:border-gray-700',
          'data-open:border-secondary data-open:ring-1 data-open:ring-secondary',
          'data-disabled:cursor-not-allowed data-disabled:border-gray-300 data-disabled:bg-gray-400 data-disabled:text-gray-500 data-disabled:hover:border-gray-300',
          'focus:outline-hidden',
          props.multiple && 'h-auto min-h-10 py-1.5',
        )}
      >
        {props.multiple ? (
          <div className='flex min-w-0 flex-1 flex-wrap items-center gap-1'>
            {hasSelection ? (
              props.selected.map(item => (
                <span
                  key={`multiple-item-${String(props.label ?? 'id')}-${item.id}`}
                  className='inline-flex items-center gap-1 rounded-lg bg-secondary-100 px-1.5 py-0.5 text-[10px] font-medium leading-[18px] text-secondary-500'
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                >
                  {getItemLabel(item)}
                  <button
                    type="button"
                    className='flex size-3 shrink-0 items-center justify-center'
                    onClick={() => props.setSelected(props.selected.filter(sItem => sItem.id !== item.id))}
                    aria-label={`Quitar ${getItemLabel(item)}`}
                  >
                    <XMarkIcon className='size-3' />
                  </button>
                </span>
              ))
            ) : (
              <span>Seleccione</span>
            )}
          </div>
        ) : (
          <span className={clsx(
            'min-w-0 flex-1 truncate',
            props.selected && !props.disabled && 'text-gray-950',
          )}>
            {props.selected ? getItemLabel(props.selected) : 'Seleccione'}
          </span>
        )}
        {hasSelection && !props.disabled && (
          <button
            type="button"
            className='flex size-5 shrink-0 items-center justify-center text-gray-800 hover:text-gray-950'
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
            aria-label='Limpiar selección'
          >
            <XMarkIcon className='size-5' />
          </button>
        )}
        <ChevronDownIcon
          className='size-5 shrink-0 text-gray-800 transition-transform group-data-open:rotate-180 group-data-disabled:text-gray-500'
          aria-hidden="true"
        />
      </ListboxButton>
      <ListboxOptions
        anchor={{ to: 'bottom', gap: 6, padding: 6 }}
        transition
        className={clsx(
          'z-50 flex w-(--button-width) origin-top flex-col gap-2 overflow-x-hidden overflow-y-auto rounded-lg bg-white p-2',
          'text-body-md text-gray-800 shadow-[0_6px_8px_rgba(0,0,0,0.1)]',
          '[--anchor-max-height:15rem] focus:outline-hidden',
          'transition duration-100 ease-out data-leave:data-closed:opacity-0',
        )}
      >
        {props.items.map((item) => (
          <ListboxOption
            key={`listbox-option-${item.id}`}
            value={item}
            className={clsx(
              'group flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-md leading-6 text-gray-800 select-none',
              'data-focus:bg-gray-100 data-selected:bg-primary-50 data-selected:text-primary-600',
            )}
          >
            <CheckIcon className="invisible size-5 shrink-0 group-data-selected:visible" aria-hidden="true" />
            <div className="min-w-0 flex-1 break-words">
              {props.item ? props.item(item) : getItemLabel(item)}
            </div>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}

export default Select
