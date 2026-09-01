'use client'

import {DetailedHTMLProps, TextareaHTMLAttributes, useRef, useCallback, useEffect, MutableRefObject, forwardRef} from "react";
import clsx from 'clsx';

export interface TextAreaProps extends  DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
  label?: string
}

const findScrollParent = (el: HTMLElement): HTMLElement | null => {
  let parent: HTMLElement | null = el.parentElement
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (overflowY === 'auto' || overflowY === 'scroll') return parent
    parent = parent.parentElement
  }
  return null
}

const resizeTextarea = (
  el: HTMLTextAreaElement,
  scrollParentRef?: MutableRefObject<HTMLElement | null | undefined>
) => {
  let scrollParent: HTMLElement | null = null
  if (scrollParentRef) {
    if (scrollParentRef.current === undefined) {
      scrollParentRef.current = findScrollParent(el)
    }
    scrollParent = scrollParentRef.current
  } else {
    scrollParent = findScrollParent(el)
  }
  const savedScrollTop = scrollParent?.scrollTop ?? 0
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
  if (scrollParent) {
    scrollParent.scrollTop = savedScrollTop
  }
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(props, ref) {
  const {label, onChange, ...inputProps} = props
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollParentRef = useRef<HTMLElement | null | undefined>(undefined)

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  useEffect(() => {
    const el = textareaRef.current
    if (el) resizeTextarea(el, scrollParentRef)
  }, [inputProps.value, inputProps.defaultValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    resizeTextarea(e.target, scrollParentRef)
    onChange?.(e)
  }, [onChange])

  return (
    <div>
      {
        label && <p className='p font-semibold'>{props.label}{props.required && <span className='text-red-600 ml-0.5'>*</span>}</p>
      }
      <textarea className={clsx(
        'transition duration-200 focus:ring-2 focus:ring-primary dark:focus:ring-primary-800 focus:outline-hidden appearance-none w-full leading-6',
        'text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500',
        'rounded-md py-2 px-3 ring-1 ring-slate-200 dark:ring-zinc-600 shadow-xs',
        'bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-700/50',
        'overflow-hidden resize-none',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-transparent'
      )}
        ref={setRefs}
        onChange={handleChange}
        {...inputProps}
      />
    </div>
  )
})

export default TextArea
