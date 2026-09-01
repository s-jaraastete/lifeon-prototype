'use client'

import {createContext, ReactNode, useContext, useState} from "react"

type FilterStoreType = {
  queryParams: string
}

type FilterActionsType = {
  getQueryParams: () => string,
  setQueryParams: (value: string) => void,
  getEndpoint: () => string,
  getReactQueryKey: () => string[]
}

type StoreContextType = {
  store: FilterStoreType,
  actions: FilterActionsType,
  updateStore: (value: Partial<FilterStoreType>) => void
}


const FilterContext = createContext<StoreContextType | undefined>(undefined)

type FilterProviderProps = {
  children: ReactNode,
  endpoint: string,
  reactQueryKey: string[]
}

const FilterStoreProvider = ({ children, ...props }: FilterProviderProps) => {
  const [endpoint, setEndpoint] = useState(props.endpoint)
  const [baseReactQueryKey, setBaseReactQueryKey] = useState<string[]>(props.reactQueryKey)
  const [store, setStore] = useState<FilterStoreType>({
    queryParams: ''
  });

  const getQueryParams = () => store.queryParams
  const setQueryParams = (value: string) => updateStore({queryParams: value})

  const updateStore = (value: Partial<FilterStoreType>) => {
    setStore({
      ...store,
      ...value,
    })
  }

  const getEndpoint = () => endpoint
  const getReactQueryKey = () => baseReactQueryKey.concat(getQueryParams())

  const actions: FilterActionsType = {
    getQueryParams,
    setQueryParams,
    getEndpoint,
    getReactQueryKey
  }

  return (
    <FilterContext.Provider value={{store, actions, updateStore} as StoreContextType}>
      <>{children}</>
    </FilterContext.Provider>
  )
}

export default FilterStoreProvider;

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("Context must be used within a Filter Provider");
  }
  return context;
}
