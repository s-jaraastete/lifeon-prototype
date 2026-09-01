'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

type NavigationTabPillProps = {
  label: string,
  activeRouteName: string,
  routeIndex: number,
  count?: number,
}

export const NavigationTabPill = (props: NavigationTabPillProps) => {
  const pathname = usePathname()
  const active = pathname.split('/')[props.routeIndex] === props.activeRouteName

  return (
    <div className={clsx(
      'hover:text-primary-700 hover:bg-primary-100 transition duration-200 px-6 py-4 rounded-lg font-semibold text-gray-400 h-full dark:hover:bg-primary-600 dark:hover:text-zinc-100 flex items-center gap-2 cursor-pointer',
      active ? 'bg-primary-200 text-primary-800 shadow-sm dark:bg-primary-800  dark:text-zinc-100' : ''
    )}
    >
      {props.label}
      {props.count != null && props.count > 0 && (
        <span className={clsx(
          'inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold',
          active ? 'bg-primary-600 text-white dark:bg-primary-200 dark:text-primary-900' : 'bg-gray-200 text-gray-600 dark:bg-zinc-600 dark:text-zinc-200'
        )}>
          {props.count}
        </span>
      )}
    </div>
  )
}

type NavigationTabProps = {
  children: ReactNode
}

const NavigationTab = (props: NavigationTabProps) => {
  
  return (
    <div className='flex gap-2 border border-solid border-gray-100 p-1 rounded-lg'>
      {props.children}
    </div>
  )
}

export default NavigationTab
