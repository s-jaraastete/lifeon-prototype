'use client'

import {createContext, ReactNode, useContext, useState} from "react"

type LoadingLinkStoreType = {
  pending: boolean
}

type LoadingLinkActionsType = {
  triggerLoadingBar: (value: boolean) => void
}

type StoreContextType = {
  store: LoadingLinkStoreType,
  actions: LoadingLinkActionsType,
  updateStore: (value: Partial<LoadingLinkStoreType>) => void
}


const LoadingLinkContext = createContext<StoreContextType | undefined>(undefined)

type LoadingLinkProviderProps = {
  children: ReactNode
}

const LoadingLinkStoreProvider = ({ children, ...props }: LoadingLinkProviderProps) => {
  const [store, setStore] = useState<LoadingLinkStoreType>({
    pending: false
  });

  const triggerLoadingBar = (value: boolean) => updateStore({pending: value})

  const updateStore = (value: Partial<LoadingLinkStoreType>) => {
    setStore({
      ...store,
      ...value,
    })
  }

  const actions: LoadingLinkActionsType = {
    triggerLoadingBar,
  }

  return (
    <LoadingLinkContext.Provider value={{store, actions, updateStore} as StoreContextType}>
      <>{children}</>
    </LoadingLinkContext.Provider>
  )
}

export default LoadingLinkStoreProvider;

export const useLoadingLinkContext = () => {
  const context = useContext(LoadingLinkContext);
  if (context === undefined) {
    throw new Error("Context must be used within a Loading Link Provider");
  }
  return context;
}
