import { Field, Label, Switch } from '@headlessui/react'
import {ReactNode} from "react";
import clsx from 'clsx'

interface CustomSwitchProps {
  checked: boolean,
  onChange: (value: boolean) => void,
  children?: ReactNode,
  disabled?: boolean
}

const GenericSwitch = (props: CustomSwitchProps) => {

  return (
    <Field disabled={props.disabled} className='flex items-center gap-3'>
      <Switch
        checked={props.checked}
        onChange={props.onChange}
        className={clsx(
          'group relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors',
          'bg-gray-300 data-checked:bg-secondary',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
          'focus:outline-hidden',
        )}
      >
        <span
          className={clsx(
            'size-[18px] rounded-full bg-white shadow-[0_2px_4px_rgba(39,39,39,0.1)] transition-transform',
            'translate-x-0 group-data-checked:translate-x-[18px]',
          )}
        />
      </Switch>
      {props.children && 
        <Label className="cursor-pointer text-body-md font-medium text-gray-950 data-disabled:cursor-not-allowed data-disabled:opacity-50">
          {props.children}
        </Label>
      }
    </Field>
  )
}

export default GenericSwitch
