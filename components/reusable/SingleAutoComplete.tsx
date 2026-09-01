"use client"

import React, {Fragment, ReactNode, useState} from "react";
import {Combobox, Transition} from "@headlessui/react";
import {CheckIcon, ChevronUpDownIcon} from "@heroicons/react/24/solid";
import useCustomInfiniteQuery from "@/components/hooks/useCustomInfiniteQuery";
import useDebounce from "@/components/hooks/useDebounce";
import Spinner from "@/components/reusable/Spinner";
import axiosManager from "@/lib/axios_manager";

interface InterfaceWithId {
  id: number
}

interface AutocompleteProps<T extends InterfaceWithId>  {
  selected: T | null,
  setSelected: (value: T | null) => void,
  item: (value: T) => ReactNode,
  // onItemSelected?: (value: T | null) => boolean, // en este caso se deja desabilitado ya que la seleccion se realiza por medio de un handler
  placeholder?: string,
  label?: keyof T,
  endpoint: string,
  queryKey: string[],
  domain?: LifeonModules
} 




const SingleAutocomplete = <T extends InterfaceWithId, >({selected, setSelected, ...props}: AutocompleteProps<T>) => {
  const [query, setQuery] = useState(
    props.label !== undefined ? (selected?.[props.label] ?? '') : ''
  )
  const [focusedInput, setFocusedInput] = useState<boolean>(false)
  const filterSeparator = props.endpoint.includes('?') ? '' : '?' 

  const rData = useCustomInfiniteQuery({
    queryKey: props.queryKey,
    queryFn: async ({pageParam="1"}) => 
      axiosManager(`${props.endpoint}${filterSeparator}&page=${pageParam}&search=${query}`,null,{useAccessToken:true,method:'get', module: props.domain  ? 'admin' : 'backend'})
  })
  const data: T[] = rData.fdata ?? []

  useDebounce(async () => {
    await rData.refetch()
  }, 1000, [query])
  
  const handleChange = (selectedItem: T | null) => {
    // if (props.onItemSelected?.(selectedItem)) return 
    setSelected(selectedItem); 
  };

  return (
    <div className="w-full">
      <Combobox value={selected} onChange={handleChange}>
        <div className="relative">
          <div
            className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left focus:outline-hidden focus-visible:ring-2
                       focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-300
                       sm:text-sm border border-solid focus-visible:border-primary-500">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(item: T | null) => (item?.[props.label ?? 'id'] ?? '') as string}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={props.placeholder ?? 'Busque y seleccione el elemento deseado en la lista'}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
            />
            {
              rData.isFetching && focusedInput ?
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <Spinner/>
                </span>
                :
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </Combobox.Button>
            }
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options
              className="absolute mt-1 p-2 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black
                         ring-opacity-5 focus:outline-hidden sm:text-sm z-10">
              {data.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Sin resultados.
                </div>
              ) : (
                data.map((person) => (
                  <Combobox.Option
                    key={person.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 rounded-md ${
                        active ? 'bg-primary-500 text-white' : 'text-gray-900'
                      }`
                    }
                    value={person}
                  >
                    {({ active }) => {
                      const isSelected = selected?.id === person.id
                      return (
                        (
                          <div>
                            <span
                              className={`block truncate ${
                                isSelected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {props.item(person)}
                            </span>
                            {isSelected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-primary-600'
                                }`}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </div>
                        )
                      )
                    }}
                  </Combobox.Option>
                ))
              )}
              <div ref={rData.ref}/>
              {rData.isFetching && <div className='p-4 flex justify-center gap-2'><Spinner/><span className='font-semibold'>Cargando...</span></div>}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}

export default SingleAutocomplete