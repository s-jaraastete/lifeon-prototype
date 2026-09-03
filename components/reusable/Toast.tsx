"use client"

import React, {ReactNode, useEffect} from "react";
import {createPortal} from "react-dom";
import {Transition} from "@headlessui/react";

export interface ToastProps {
  open: boolean,
  onClose: () => void,
  children: ReactNode,
  duration?: number,
}

const Toast = (props: ToastProps) => {
  useEffect(() => {
    if (!props.open) return
    if (props.duration === undefined) return
    setTimeout(() => {
      props.onClose()
    }, props.duration)
    // eslint-disable-next-line
  }, [props.open])


  if (typeof document === "undefined") return null;

  return createPortal(
    <Transition show={props.open}>
      <div className='fixed z-50 w-full left-0 top-0 flex justify-center' onClick={props.onClose}>
        <Transition.Child
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className='rounded-lg border-solid border-gray-200 border shadow-md bg-white max-w-2xl min-w-100 mt-4 py-4 px-4'>
            {props.children}
          </div>
        </Transition.Child>
      </div>
    </Transition>,
    document.body,
  )
}

export default Toast
