import { XCircleIcon } from '@heroicons/react/24/solid';
import React, {ReactElement} from "react";
import clsx from 'clsx'

type ChipNoButtonProps = {
  onClick?: never,
  buttonIcon?: never
}

type ChipButtonProps = {
  onClick: () => void,
  buttonIcon?: ReactElement<any, any>,
}

export type ChipVariants = 'primary' | 'secondary' | 'info' | 'warning' | 'danger' | 'default' | 'success'

type ChipProps = (ChipButtonProps | ChipNoButtonProps) & {
  label: string | any,
  icon?: ReactElement<any, any>,
  variant?: ChipVariants
}

const Chip = (props: ChipProps) => {
  const Icon = () => props.icon
  const ButtonIcon = () => props.buttonIcon
  const variant = {
    primary: 'chip-primary',
    secondary: 'chip-secondary',
    info: 'chip-info',
    warning: 'chip-warning',
    danger: 'chip-danger',
    default: 'chip-default',
    success: 'chip-success',
  }
  const buttonVariant = {
    primary: 'chip-button-primary',
    secondary: 'chip-button-secondary',
    info: 'chip-button-info',
    warning: 'chip-button-warning',
    danger: 'chip-button-danger',
    default: 'chip-button-default',
    success: 'chip-button-success',
  }

  return (
    <div>
      <div className='flex'>
        <div className={`chip-common ${variant[props.variant ?? 'default']}`}>
          {props.icon &&
            <div>
              <div className='w-5 h-5'>
                <Icon/>
              </div>
            </div>
          }
          <span>{props.label}</span>
          {props.onClick &&
            <button onClick={props.onClick}>
              <div className={clsx(
                'w-5 h-5 transition duration-200 cursor-pointer',
                buttonVariant[props.variant ?? 'default']
              )}>
                {props.buttonIcon !== undefined ? <ButtonIcon/> : <XCircleIcon/>}
              </div>
            </button>
          }
        </div>
      </div>
    </div>
  )
}

export default Chip