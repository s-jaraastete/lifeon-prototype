'use client'

import {createContext, ReactNode, useContext} from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {XMarkIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const ModalCloseContext = createContext<(() => void) | null>(null)

interface ModalProps {
  open: boolean,
  onClose: () => void,
  children: ReactNode,
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  closeOnBackdropClick?: boolean,
}

const Modal = (props: ModalProps) => {
  const size = {
    xs: 'max-w-xl',
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <Dialog
      open={props.open}
      as="div"
      className="relative z-50 focus:outline-hidden"
      onClose={props.closeOnBackdropClick === false ? () => {} : props.onClose}
    >
      <DialogBackdrop transition className={clsx(
        'ease-out data-closed:opacity-0 duration-200',
        'fixed inset-0 bg-gray-950/20'
      )} />
      <div className="fixed inset-0">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={clsx(
              'duration-300 data-closed:scale-95 data-closed:opacity-0 overflow-y-auto',
              'flex w-full max-h-[96vh] transform flex-col rounded-2xl bg-white text-left align-middle shadow-[0_14px_30px_-4px_rgba(0,0,0,0.15)] transition-all',
              size[props.size ?? 'xs']
            )}
          >
            <ModalCloseContext.Provider value={props.onClose}>
              {props.children}
            </ModalCloseContext.Provider>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

interface TitleProps {
  children: ReactNode
}

export const ModalTitle = (props: TitleProps) => {
  const onClose = useContext(ModalCloseContext)

  return (
    <div className='shrink-0'>
      <div className='flex items-center justify-between gap-4 px-6 pb-5 pt-6'>
        <DialogTitle
          as="h3"
          className='h6 m-0 min-w-0 flex-1'
        >
          {props.children}
        </DialogTitle>
        {onClose && (
          <button
            type='button'
            onClick={onClose}
            aria-label='Cerrar'
            className='flex size-[35px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-800 transition-colors hover:bg-gray-100'
          >
            <XMarkIcon className='size-5' />
          </button>
        )}
      </div>
      <div className='h-px w-full bg-gray-300' />
    </div>
  )
}

interface ModalBodyProps {
  children: ReactNode
}

export const ModalBody = (props: ModalBodyProps) => {
  return (
    <div className='px-6 py-6 text-body-md text-gray-800'>
      {props.children}
    </div>
  )
}

interface ModalActionButtonProps {
  children: ReactNode
}

export const ModalActionButtons = (props: ModalActionButtonProps) => {
  return (
    <div className='flex shrink-0 items-center justify-end gap-3 px-6 pb-6'>
      {props.children}
    </div>
  )
}

export default Modal
