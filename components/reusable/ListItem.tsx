'use client';

import {DetailedHTMLProps, HTMLAttributes, LiHTMLAttributes, ReactElement} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface ListGroupProps extends DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement> {}

const ListGroup = (props: ListGroupProps) => {
  return (
    <ul className='flex w-full flex-col gap-2.5'>
      {props.children}
    </ul>
  )
}

interface ItemProps extends DetailedHTMLProps<LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>{
  label: string,
  icon?: ReactElement<any, any>,
  path?: string,
  badge?: number,
}

const Item = ({label, icon, path, badge, ...props}: ItemProps) => {
  const Icon = () => icon ? icon : <></>
  const pathname = usePathname()
  const isActive = path !== undefined && (
    pathname === path ||
    pathname.startsWith(path + '/') ||
    path.startsWith(pathname + '/')
  )

  const badgeLabel = badge !== undefined && badge > 0
    ? (badge > 99 ? '99+' : String(badge))
    : null

  const Core = () => {
    return (
      <li
        title={label}
        className={clsx(
          'flex h-[42px] w-full items-center gap-2 rounded-lg px-3 py-2 text-base leading-6 text-[#111] transition duration-200',
          'lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0',
          isActive ? 'bg-[#F0F9F7] font-medium' : 'hover:bg-[#FAFAFA]'
        )}
        {...props}
      >
        {icon ? (
          <div className='flex size-5 shrink-0 items-center justify-center [&>svg]:size-full'>
            <Icon/>
          </div>
        ) : (
          <div className='size-5 shrink-0'/>
        )}
        <span className='min-w-0 grow truncate lg:group-data-[collapsed=true]/sidebar:hidden'>{label}</span>
        {badgeLabel && (
          <span className='flex h-[13px] shrink-0 items-center justify-center rounded bg-[#DBEAFE] px-1 text-[8px] font-medium leading-[18px] text-[#155DFC] lg:group-data-[collapsed=true]/sidebar:hidden'>
            {badgeLabel}
          </span>
        )}
      </li>
    )
  }

  if (path === undefined) {
    return <Core/>
  }

  return (
    <Link href={path} className="block w-full">
      <Core/>
    </Link>
  )
}
ListGroup.Item = Item

export { Item as ListGroupItem }
export default ListGroup
