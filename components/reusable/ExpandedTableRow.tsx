'use client'

import clsx from 'clsx'
import { ReactNode, useEffect, useState } from 'react'

type ExpandedTableRowProps = {
  colSpan: number
  open: boolean
  children: ReactNode
}

const ExpandedTableRow = (props: ExpandedTableRowProps) => {
  const [shouldRender, setShouldRender] = useState(props.open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (props.open) {
      setShouldRender(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
    const timeout = setTimeout(() => setShouldRender(false), 200)
    return () => clearTimeout(timeout)
  }, [props.open])

  if (!shouldRender) return null

  return (
    <tr className='bg-gray-50 border-b border-gray-200'>
      <td colSpan={props.colSpan} className='p-0'>
        <div
          className={clsx(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            visible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className='overflow-hidden'>
            <div
              className={clsx(
                'p-3 origin-top transition duration-200 ease-out',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              )}
            >
              {props.children}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default ExpandedTableRow
