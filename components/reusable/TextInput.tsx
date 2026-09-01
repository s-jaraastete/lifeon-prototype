import {DetailedHTMLProps, InputHTMLAttributes} from "react";
import clsx from 'clsx';


export interface TextInputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>{
  label?: string,
  className?: string,
}

const TextInput = (props: TextInputProps) => {
  const {label, className, ...inputProps} = props
  
  return (
    <div>
      {
        label && <p className='p font-semibold'>{props.label}{props.required && <span className='text-red-600 ml-0.5'>*</span>}</p>
      }
      <input
        className={clsx(
          'transition duration-200 focus:ring-2 focus:ring-primary dark:focus:ring-primary-800 focus:outline-hidden appearance-none w-full leading-6 ',
          'placeholder-slate-400 dark:placeholder-zinc-500 rounded-md py-2 px-2 ring-1 ring-slate-200 dark:ring-zinc-600',
          'bg-white',
          props.disabled ? 'cursor-not-allowed bg-gray-100! text-gray-500 ' : 'text-slate-900 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 dark:text-zinc-100',
          className ?? ''
        )}
        {...inputProps}
      />
    </div>
  )
}

export default TextInput