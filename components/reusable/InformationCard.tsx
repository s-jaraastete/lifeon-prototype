import React, {ReactElement, ReactNode} from "react";

interface InformationCardProps {
  children: ReactNode,
  icon?: ReactElement<any, any>,
  variant?: 'primary' | 'info' | 'warning' | 'danger' | 'default' | 'success'
}

const InformationCard = (props: InformationCardProps) => {
  const Icon = () => props.icon ? props.icon : <></>
  const variant = {
    primary: 'chip-primary',
    info: 'chip-info',
    warning: 'chip-warning',
    danger: 'chip-danger',
    default: 'chip-default',
    success: 'chip-success',
  }

  return (
    <div className={`px-6 py-4 rounded-sm flex gap-2 ${variant[props.variant ?? 'default']}`}>
      {props.icon && <div><div className='w-6 h-6 items-center flex'><Icon/></div></div>}
      <div>
        {props.children}
      </div>
    </div>
  )
}

export default InformationCard