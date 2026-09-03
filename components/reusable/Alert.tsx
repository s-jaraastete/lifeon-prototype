"use client"

import Toast, {ToastProps} from "@/components/reusable/Toast";
import React, {ReactNode} from "react";
import {CheckCircleIcon, ExclamationCircleIcon} from "@heroicons/react/24/solid";


interface AlertBodyProps {
  title: string,
  children?: ReactNode,
  type: 'success' | 'error'
}

const AlertBody = (props: AlertBodyProps) => {
  const titleColor = {
    success: 'text-green-700',
    error: 'text-red-700'
  }
  const icon = {
    success: <CheckCircleIcon/>,
    error: <ExclamationCircleIcon/>
  }
  return (
    <div className='flex gap-2 z-50'>
      <div>
        <div className={`w-6 h-6 ${titleColor[props.type]}`}>
          {icon[props.type]}
        </div>
      </div>
      <div>
        <p className={`font-semibold ${titleColor[props.type]}`}>{props.title}</p>
        {props.children &&
          <div className='mt-2 text-sm text-gray-500'>
            {props.children}
          </div>
        }
      </div>
    </div>
  )
}

interface AlertProps extends AlertBodyProps, Omit<ToastProps, 'children'> {}

const Alert = (props: AlertProps) => {
  return (
    <Toast open={props.open} onClose={props.onClose} duration={props.duration}>
      <AlertBody title={props.title} type={props.type}>
        {props.children}
      </AlertBody>
    </Toast>
  )
}

export default Alert