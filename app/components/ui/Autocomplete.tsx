"use client"

import React, {ReactNode, useCallback, useEffect, useRef, useState} from "react";
import { Combobox, ComboboxButton, ComboboxOption, ComboboxInput, ComboboxOptions, Transition } from '@headlessui/react'
import { LuChevronDown, LuCircleCheck, LuCirclePlus } from "react-icons/lu";
import useCustomInfiniteQuery from "@/hooks/useCustomInfiniteQuery";
import axiosFetcher from "@/lib/axios_fetcher";
import useDebounce from "@/hooks/useDebounce";
import Spinner from "./Spinner";
import Chip from "./Chip";
import clsx from 'clsx'

type InterfaceWithId = {
  id: number
}

type SingleAutocompleteProps <T extends InterfaceWithId> = {
  multiple?: false | never,
  selected: T | null,
  setSelected: (value: T | null) => void,
  onItemSelected?: (value: T | null) => void,
}

type MultipleAutocompleteProps <T extends InterfaceWithId> = {
  multiple: true,
  selected: T[],
  setSelected: (value: T[]) => void,
  onAfterClickChip?: (item: T) => void
  onItemSelected?: (value: T[]) => void,
}

type AutocompleteProps<T extends InterfaceWithId> = (MultipleAutocompleteProps<T> | SingleAutocompleteProps<T>) & {
  viewOnly?:boolean,
  endpoint: string,
  item: (value: T) => ReactNode,
  placeholder?: string,
  queryKey: string[],
  label?: keyof T
  domain?: string,
  useAccessToken?: boolean,
  searchParam?: string,
  onClose?: () => void
  enableAutocomplete?: boolean
  optionsHeight?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  onCreate?: (name: string) => Promise<T | null | undefined>
}


const SyncOptionsLayoutEffect = ({
  open,
  sync,
}: {
  open: boolean
  sync: () => void
}) => {
  useEffect(() => {
    if (!open) return
    sync()
    const rafId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(rafId)
  }, [open, sync])

  return null
}


const Autocomplete = <T extends InterfaceWithId, >(props: AutocompleteProps<T>) => {
  const [query, setQuery] = useState('')
  const [optionsLayout, setOptionsLayout] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
    maxHeight: number
  } | null>(null)
  const controlRef = useRef<HTMLElement | null>(null)
  const optionsRef = useRef<HTMLDivElement | null>(null)
  const optionsScrollTopRef = useRef(0)
  const previousDataLengthRef = useRef(0)
  const previousQueryRef = useRef(query)
  const filterSeparator = props.endpoint.includes('?') ? '' : '?'

  const optionsHeight = {
    sm: 240,
    md: 320,
    lg: 400,
    xl: 480,
    '2xl': 560,
  }

  const syncOptionsLayout = useCallback(() => {
    if (!controlRef.current) return

    const rect = controlRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const gap = 4
    const padding = 8
    const preferredHeight = optionsHeight[props.optionsHeight ?? 'sm']
    const spaceBelow = viewportHeight - rect.bottom - padding
    const spaceAbove = rect.top - padding
    const renderAbove = spaceBelow < Math.min(220, preferredHeight) && spaceAbove > spaceBelow
    const maxHeight = Math.min(preferredHeight, Math.max(renderAbove ? spaceAbove : spaceBelow, 1))

    setOptionsLayout({
      left: rect.left,
      width: rect.width,
      maxHeight,
      ...(renderAbove
        ? { bottom: viewportHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }, [props.optionsHeight])

  const getItemLabel = (item: T | null | undefined) => {
    if (!item) return ''
    return String(item[props.label ?? 'id'])
  }

  const rData = useCustomInfiniteQuery({
    queryKey: props.queryKey,
    queryFn: async ({pageParam="1"}) => (await axiosFetcher(
      `${props.endpoint}${filterSeparator}&page=${pageParam}&${props.searchParam ?? "search"}=${query}`,
      {useAccessToken: props.useAccessToken ?? true, domain: props.domain}
    )).data
  })
  const data: T[] = rData.fdata ?? []

  useDebounce(async () => {
    await rData.refetch()
  }, 1000, [query])

  useEffect(() => {
    const el = controlRef.current
    if (!el) return

    syncOptionsLayout()
    const observer = new ResizeObserver(syncOptionsLayout)
    observer.observe(el)
    window.addEventListener('resize', syncOptionsLayout)
    window.addEventListener('scroll', syncOptionsLayout, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncOptionsLayout)
      window.removeEventListener('scroll', syncOptionsLayout, true)
    }
  }, [syncOptionsLayout])

  useEffect(() => {
    const isSameQuery = previousQueryRef.current === query
    const isAppendingData = isSameQuery && data.length > previousDataLengthRef.current

    if (isAppendingData) {
      const currentScrollTop = optionsScrollTopRef.current
      requestAnimationFrame(() => {
        if (optionsRef.current) {
          optionsRef.current.scrollTop = currentScrollTop
        }
      })
    }

    previousDataLengthRef.current = data.length
    previousQueryRef.current = query
  }, [data.length, query])

  const handleChange = (value: typeof props.multiple extends true ? T[] : (T | null)) => {
    if (props.multiple) {
      props.onItemSelected?.(value as unknown as T[])
      return props.setSelected(value as unknown as T[])
    }
    props.onItemSelected?.(value)
    return props.setSelected(value)
  }

  const handleChipClick = (item: T) => {
    if (!props.multiple) return
    props.setSelected(props.selected.filter(sItem => sItem.id !== item.id))
    props.onAfterClickChip?.(item)
  }

  const handleClose = () => {
    props.onClose?.()
    setQuery('')
  }

  const handleCreate = async () => {
    if (!props.onCreate || !query) return
    const newItem = await props.onCreate(query)
    if (newItem) {
      if (props.multiple) {
        props.setSelected([...props.selected, newItem])
      } else {
        props.setSelected(newItem)
      }
      setQuery('')
    }
  }

  const getPlaceholder = () => {
    if (props.placeholder !== undefined) return props.placeholder
    const genericPlaceholder = 'Ingrese acá para buscar'
    if (!props.multiple) return genericPlaceholder
    if (props.selected.length === 0) return genericPlaceholder
    if (props.selected.length === 1) return '1 elemento seleccionado. Clic para escribir y buscar más.'
    return `${props.selected.length} elementos seleccionados. Clic acá para escribir y buscar más.`
  }


  return (
    <div className="w-full">
    <Combobox
      immediate
      multiple={props.multiple}
      value={props.selected as typeof props.multiple extends true ? T[] : (T | null)}
      onChange={value => handleChange(value as typeof props.multiple extends true ? T[] : (T | null))}
      onClose={handleClose}
    >
      {({ open }) => (
      <>
      <SyncOptionsLayoutEffect open={open} sync={syncOptionsLayout} />
      <ComboboxButton
        as="div"
        ref={(node) => { controlRef.current = node }}
        className={clsx(
          'input-ring w-full cursor-text transition duration-200 rounded-xl bg-white',
          'focus-within:ring-2 focus-within:ring-secondary focus:outline-none',
          'flex items-center justify-between gap-2',
          props.multiple ? 'flex-wrap min-h-10 gap-1 px-2 py-1 pr-10' : 'py-3 px-5'
        )}
      >
        {props.multiple && props.selected.length > 0 && props.selected.map(item => (
          <div
            key={`multiple-item-${String(props.label ?? 'id')}-${item.id}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => event.stopPropagation()}
          >
            <Chip
              label={item[props.label ?? 'id']}
              onClick={() => handleChipClick(item)}
            />
          </div>
        ))}
        <ComboboxInput
          placeholder={getPlaceholder()}
          className={clsx(
            'appearance-none focus:outline-hidden leading-normal placeholder-gray-700 bg-transparent',
            props.multiple ? 'min-w-40 flex-1 py-1 pr-7' : 'flex-1 py-0'
          )}
          displayValue={(item: typeof props.multiple extends true ? T[] : (T | null)) => {
            if (props.multiple) return query
            if (item !== null) return getItemLabel(item as T)
            return getItemLabel(props.selected as T | null)
          }}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === ' ') {
              event.stopPropagation()
            }
          }}
          onFocus={syncOptionsLayout}
          autoComplete={props.enableAutocomplete ? 'on' : 'off'}
        />
        {rData.isFetching ?
          <span className="pointer-events-none flex items-center justify-center shrink-0">
            <Spinner/>
          </span>
          :
          <span className="pointer-events-none flex items-center justify-center shrink-0">
            <LuChevronDown className="w-5 h-5 text-gray-700 shrink-0" />
          </span>
        }
      </ComboboxButton>
      <Transition
        show={open}
        enter="transition duration-200 ease-out"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition duration-150 ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <ComboboxOptions
          portal
          ref={optionsRef}
          onScroll={(event) => {
            optionsScrollTopRef.current = event.currentTarget.scrollTop
          }}
          onMouseDown={(e) => e.preventDefault()}
          style={optionsLayout ? {
            position: 'fixed',
            left: optionsLayout.left,
            width: optionsLayout.width,
            maxHeight: optionsLayout.maxHeight,
            ...(optionsLayout.top !== undefined
              ? { top: optionsLayout.top }
              : { bottom: optionsLayout.bottom }),
          } : undefined}
          className={clsx(
            'input-ring overflow-y-auto rounded-xl bg-white py-2',
            'focus:outline-hidden z-50',
            '[&::-webkit-scrollbar]:w-3',
            '[&::-webkit-scrollbar-track]:my-1.5',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb]:bg-gray-500',
            '[&::-webkit-scrollbar-thumb]:border-2',
            '[&::-webkit-scrollbar-thumb]:border-solid',
            '[&::-webkit-scrollbar-thumb]:border-transparent',
            '[&::-webkit-scrollbar-thumb]:bg-clip-padding',
          )}
        >
        {data.length === 0 ? (
            <div className="cursor-default select-none py-3 px-5 text-gray-700">
              Sin resultados.
            </div>
          ) : (
            data.map(item => (
              <ComboboxOption
                key={item.id}
                value={item}
                className={clsx(
                  'group flex cursor-pointer items-start gap-2 py-3 px-5 select-none data-focus:bg-gray-200',
                  'text-base text-black',
                )}
              >
                <LuCircleCheck className="invisible size-4 group-data-selected:visible text-primary-text mt-1 shrink-0" />
                <div className="w-full">
                  {props.item(item)}
                </div>
              </ComboboxOption>
            ))
          )
        }
        {props.onCreate && query.length > 0 && (
          <button
            type="button"
            className="flex w-full cursor-pointer items-start gap-2 rounded-lg py-1.5 px-3 select-none hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-primary-700 dark:hover:text-white transition duration-100 text-left"
            onMouseDown={(e) => { e.preventDefault(); handleCreate() }}
          >
            <LuCirclePlus className="size-4 mt-1 shrink-0 text-primary-600 dark:text-primary-300" />
            <div className="text-sm/6 text-primary-600 dark:text-primary-300 w-full">
              Crear &ldquo;{query}&rdquo;
            </div>
          </button>
        )}
        <div ref={rData.ref}/>
        {rData.isFetching && <div className='p-4 flex justify-center gap-2'><Spinner/><span className='font-semibold'>Cargando...</span></div>}
        </ComboboxOptions>
      </Transition>
      </>
      )}
    </Combobox>
    </div>
  )
}


export default Autocomplete
