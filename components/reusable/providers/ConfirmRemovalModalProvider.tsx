'use client'

import React, {createContext, useContext, useState} from "react"

type StoreSpecificationsInterface<ModalData> = {
  open: boolean,
  data: ModalData
}

type ActionsSpecificationInterface<ModalData> = {
  openModal: (data: ModalData) => void,
  closeModal: (data: ModalData) => void,
  setOpen: (value: boolean) => void,
}

type StoreContextInterface<ModalData> = {
  store: StoreSpecificationsInterface<ModalData>,
  actions: ActionsSpecificationInterface<ModalData>,
  updateStore: (value: Partial<StoreSpecificationsInterface<ModalData>>) => void,
}

const StoreContext = createContext<StoreContextInterface<any> | undefined>(undefined)

type MenuConfigurationProviderProps<ModalData> = {
  children: React.ReactNode,
  data?: ModalData
}

const ConfirmRemovalModalStoreProvider = <ModalData,>({ children, ...props }: MenuConfigurationProviderProps<ModalData>) => {
  // This provider is intented to be used for modals that will remove data using server actions. Because removing a piece of data with server actions fetches a 
  //  new HTML segment with the updated data, it could happen that the modal that triggered that action is removed, not being able to show the notification
  //  making the user experience kinda clunky
  
  const [store, setStore] = useState<StoreSpecificationsInterface<ModalData>>({
    open: false,
    data: props.data ?? {} as ModalData
  });

  const updateStore = (value: Partial<StoreSpecificationsInterface<ModalData>>) => {
    setStore({
      ...store,
      ...value,
    })
  }

  const openModal = (data: ModalData) => updateStore({open: true, data})
  const closeModal = () => updateStore({open: false})
  const setOpen = (value: boolean) => updateStore({open: value})
  
  const actions: ActionsSpecificationInterface<ModalData> = {
    openModal,
    closeModal,
    setOpen
  }

  return (
    <StoreContext.Provider value={{store, actions, updateStore} as StoreContextInterface<ModalData>}>
      {children}
    </StoreContext.Provider>
  )
}

export default ConfirmRemovalModalStoreProvider;

export const useServerConfirmModalContext = <ModalData, >() => {
  // @ts-ignore: Ignored in the meanwhile until I find out how to fix the any type on the StoreContext
  const context = useContext<StoreContextInterface<ModalData>>(StoreContext);
  if (context === undefined) {
    throw new Error("Context must be used within a Provider");
  }
  return context;
}