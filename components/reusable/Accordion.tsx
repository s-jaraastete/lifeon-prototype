'use client'

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import {ChevronUpIcon} from "@heroicons/react/24/solid";
import {ReactNode} from "react";
import clsx from 'clsx'

type AccordionProps = {
  label: string,
  openedLabel?: string,
  children: ReactNode
}

const Accordion = (props: AccordionProps) => {

  return (
    <Disclosure as="div" className="w-full border border-gray-200 dark:border-gray-600 rounded-md drop-shadow-sm bg-white dark:bg-zinc-800">
      {({open}) => (
        <>
          <DisclosureButton className={clsx(
            'flex w-full justify-between rounded-md px-4 py-2 text-left text-primary-700',
            'dark:text-primary-500 dark:hover:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-800',
            'transition duration-300 font-semibold cursor-pointer'
          )}>
            <span>
              {open ? (props.openedLabel ?? props.label) : props.label}
            </span>
            <span>
              <ChevronUpIcon className={clsx('duration-300 h-5 w-5 text-primary-500', open ? 'rotate-180' : '')}/>
            </span>
          </DisclosureButton>
          <div className="overflow-hidden">
            <DisclosurePanel
              transition
              className="p-4 origin-top transition duration-200 ease-out data-closed:-translate-y-6 data-closed:opacity-0"
            >
              {props.children}
            </DisclosurePanel>
          </div>
        </>
      )}
    </Disclosure>
  )
}

export default Accordion