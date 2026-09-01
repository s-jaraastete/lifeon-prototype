"use client"

import React, {ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Combobox, ComboboxButton, ComboboxOption, ComboboxInput, ComboboxOptions } from '@headlessui/react'
import {CheckCircleIcon, ChevronDownIcon, PlusCircleIcon} from "@heroicons/react/24/solid";
import useCustomInfiniteQuery from "@/components/hooks/useCustomInfiniteQuery";
import axiosFetcher from "@/lib/axios_fetcher";
import useDebounce from "@/components/hooks/useDebounce";
import Spinner from "@/components/reusable/Spinner";
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
  onClose?: () => void
  enableAutocomplete?: boolean
  optionsHeight?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  onCreate?: (name: string) => Promise<T | null | undefined>
  debounceSearch?: boolean
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
  const debounceSearch = props.debounceSearch ?? false
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
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

  const activeSearchQuery = debounceSearch ? debouncedQuery : query

  const rData = useCustomInfiniteQuery({
    queryKey: debounceSearch ? [...props.queryKey, debouncedQuery] : props.queryKey,
    queryFn: async ({pageParam="1"}) => (await axiosFetcher(
      `${props.endpoint}${filterSeparator}&page=${pageParam}&search=${encodeURIComponent(activeSearchQuery)}`,
      {useAccessToken: true, domain: props.domain}
    )).data
  })
  const data: T[] = rData.fdata ?? []

  const selectedItems = useMemo(() => {
    if (props.multiple) return props.selected
    return props.selected ? [props.selected] : []
  }, [props.multiple, props.selected])

  // Keep current selection(s) pinned at the top even if they live on later pages.
  const displayData = useMemo(() => {
    if (selectedItems.length === 0) return data
    const selectedIds = new Set(selectedItems.map((item) => item.id))
    const rest = data.filter((item) => !selectedIds.has(item.id))
    return [...selectedItems, ...rest]
  }, [data, selectedItems])

  useDebounce(() => {
    if (debounceSearch) {
      setDebouncedQuery(query)
      return
    }
    void rData.refetch()
  }, debounceSearch ? 300 : 1000, [query, debounceSearch])

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
    const next = props.selected.filter(
      (sItem) => Number(sItem.id) !== Number(item.id)
    )
    props.setSelected(next)
    props.onItemSelected?.(next)
    props.onAfterClickChip?.(item)
  }

  const handleClose = () => {
    props.onClose?.()
    setQuery('')
    if (debounceSearch) {
      setDebouncedQuery('')
    }
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
      by="id"
      value={props.selected as typeof props.multiple extends true ? T[] : (T | null)} 
      onChange={value => handleChange(value as typeof props.multiple extends true ? T[] : (T | null))} 
      onClose={handleClose}
    >
      {({ open }) => (
      <>
      <SyncOptionsLayoutEffect open={open} sync={syncOptionsLayout} />
      <div
        ref={(node) => { controlRef.current = node }}
        className={clsx(
          'relative w-full cursor-text transition duration-200 ring-1 ring-slate-200 rounded-md bg-white dark:bg-transparent',
          'hover:bg-zinc-100 dark:hover:bg-zinc-700/50 dark:ring-zinc-600',
          'focus-within:ring-2 focus-within:ring-primary dark:focus-within:ring-primary-600',
          props.multiple ? 'flex min-h-10 flex-wrap items-center gap-1 px-2 py-1 pr-10' : ''
        )}
      >
        {props.multiple && props.selected.length > 0 && props.selected.map(item => (
          <Chip
            key={`multiple-item-${String(props.label ?? 'id')}-${item.id}`}
            label={item[props.label ?? 'id']}
            onClick={() => handleChipClick(item)}
          />
        ))}
        <ComboboxInput
          placeholder={getPlaceholder()}
          className={clsx(
            'appearance-none leading-6 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-200',
            'focus:outline-hidden bg-transparent',
            props.multiple ? 'min-w-40 flex-1 py-1 pr-7' : 'w-full rounded-md py-2 px-2 pr-9'
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
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5">
            <Spinner/>
          </span>
          :
          <ComboboxButton className="group absolute inset-y-0 right-0 flex items-center px-2.5">
            <ChevronDownIcon className="size-4 fill-slate-400 group-data-hover:fill-primary transition duration-200" />
          </ComboboxButton>
        }
      </div>
      <ComboboxOptions
        portal
        ref={optionsRef}
        transition
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
          'border p-1 empty:invisible overflow-y-auto rounded-md bg-white dark:bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black/5',
          'focus:outline-hidden sm:text-sm z-50',
          'transition duration-200 ease-in data-leave:data-closed:opacity-0',
          'dark:border-zinc-600',
        )}
      >
      {displayData.length === 0 ? (
          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
            Sin resultados.
          </div>
        ) : (
          displayData.map(item => (
            <ComboboxOption
              key={item.id}
              value={item}
              className={clsx(
                'group flex cursor-default items-start gap-2 rounded-lg py-1.5 px-3 select-none data-focus:bg-primary-100 dark:data-focus:bg-primary-800',
                'data-focus:text-primary-700 dark:data-focus:text-white transition duration-100 cursor-pointer',
              )}
            >
              <CheckCircleIcon className={clsx(
                'invisible size-4 group-data-selected:visible group-data-selected:fill-primary-600 mt-[4px]',
                'dark:group-data-selected:fill-primary-300 dark:group-data-selected:focus:fill-primary-100'
              )} />
              <div className={clsx(
                'text-sm/6 group-data-selected:text-primary-600 dark:group-data-selected:text-primary-300 w-full'
              )}>
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
          <PlusCircleIcon className="size-4 mt-1 shrink-0 fill-primary-600 dark:fill-primary-300" />
          <div className="text-sm/6 text-primary-600 dark:text-primary-300 w-full">
            Crear &ldquo;{query}&rdquo;
          </div>
        </button>
      )}
      <div ref={rData.ref}/>
      {rData.isFetching && <div className='p-4 flex justify-center gap-2'><Spinner/><span className='font-semibold'>Cargando...</span></div>}
      </ComboboxOptions>
      </>
      )}
    </Combobox>
    </div>
  )
}


export default Autocomplete