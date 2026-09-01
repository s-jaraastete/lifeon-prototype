import { Menu, MenuButton, MenuItem as HeadlessMenuItem, MenuItems } from '@headlessui/react'
import React, {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactElement,
  ReactNode,
} from 'react'
import {EllipsisHorizontalIcon} from "@heroicons/react/24/outline";
import clsx from 'clsx';

interface MenuItemProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  children: ReactNode,
  icon?: ReactElement<any, any>,
}

export const MenuItem = ({children, icon, className, ...props}: MenuItemProps) => {
  const Icon = () => icon ?? <></>
  return (
    <HeadlessMenuItem>
      <button className={clsx(
        'flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-left text-body-md leading-6 text-gray-800 transition-colors',
        'hover:bg-gray-100 data-focus:bg-gray-100',
        props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )} {...props}>
        {icon &&
          <div className='flex size-5 shrink-0 items-center justify-center [&>svg]:size-full'>
            <Icon/>
          </div>
        }
        <span>{children}</span>
      </button>
    </HeadlessMenuItem>
  )
}

interface MenuGroupProps {
  children: ReactNode
}

export const MenuGroup = (props: MenuGroupProps) => {
  return (
    <div className="flex flex-col gap-2 px-2 not-first:border-t not-first:border-gray-300 not-first:pt-2">
      {props.children}
    </div>
  )
}

interface GenericMenuProps {
  children: ReactNode
}

const GenericMenu = (props: GenericMenuProps) => {

  return (
    <div>
      <Menu>
        <MenuButton className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 transition-colors hover:bg-gray-100 data-open:bg-gray-100">
          <EllipsisHorizontalIcon className="size-5" aria-hidden="true"/>
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom end"
          className={clsx(
            "z-50 flex origin-top-right flex-col gap-2 rounded-lg bg-white py-2 text-gray-800 shadow-[0_6px_8px_rgba(0,0,0,0.1)]",
            "min-w-56 [--anchor-gap:8px] focus:outline-hidden",
            "transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0",
          )}
        >
          {props.children}
        </MenuItems>
      </Menu>
    </div>
  )
}

export default GenericMenu
