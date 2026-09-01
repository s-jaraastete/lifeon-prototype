'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Link from './next_link/Link'

type TabsProps = {
  children: ReactNode
}

export const TabsNavigation = ({ children }: TabsProps) => (
  <div>
    {children}
  </div>
)

type TabsListProps = {
  children: ReactNode
}

export const TabsListNavigation = ({ children }: TabsListProps) => (
  <ul className='flex gap-1.5 bg-gray-200/80 p-1.5 rounded-lg'>
    {children}
  </ul>
)

type TabsTriggerProps = {
  href: string
  children: ReactNode
}

export const TabsTriggerNavigation = ({ href, children }: TabsTriggerProps) => {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'block px-3 py-2 rounded-lg select-none transition-colors duration-150 text-sm cursor-pointer',
          active
            ? 'bg-white shadow-sm font-semibold text-primary'
            : 'hover:bg-primary-200 hover:text-primary-600 text-gray-500'
        )}
      >
        {children}
      </Link>
    </li>
  )
}
