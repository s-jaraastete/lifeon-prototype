'use client'

import { ReactNode, useState } from 'react';

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  asChild?: boolean
  delayDuration?: number
}

const Tooltip = (props: TooltipProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex group"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {props.children}
      {visible && props.content && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap">
          {props.content}
        </div>
      )}
    </div>
  )
}

export default Tooltip
