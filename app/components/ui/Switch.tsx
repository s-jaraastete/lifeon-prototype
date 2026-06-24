import React, { useState, useEffect, forwardRef } from 'react'

type SwitchProps = {
  id?: string;
  checked?: boolean; // controlled
  defaultChecked?: boolean; // uncontrolled
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: React.ReactNode;
  ariaLabel?: string;
  bgColor?: string;
}

const sizeMap = {
  sm: { switch: 'w-9 h-5', knob: 'w-4 h-4' },
  md: { switch: 'w-12 h-6', knob: 'w-5 h-5' },
  lg: { switch: 'w-16 h-8', knob: 'w-6 h-6' },
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>((props, ref) => {
  const {
    id,
    checked,
    defaultChecked = false,
    onChange,
    disabled = false,
    size = 'md',
    className = '',
    label,
    ariaLabel,
    bgColor = 'bg-teal-500',
  } = props

  const isControlled = checked !== undefined
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked)

  useEffect(() => {
    if (isControlled) return
    setInternalChecked(defaultChecked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultChecked])

  const current = isControlled ? (checked as boolean) : internalChecked

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked
    if (!isControlled) setInternalChecked(next)
    onChange?.(next)
  }

  const s = sizeMap[size]

  return (
    <label className={`inline-flex items-center gap-2 ${className}`} htmlFor={id}>
      {label && <span className="select-none">{label}</span>}

      <div className={`relative ${s.switch}`} aria-hidden="true">
        <input
          id={id}
          ref={ref as any}
          type="checkbox"
          className="sr-only"
          checked={current}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
        />

        <div
          className={`w-full h-full rounded-full cursor-pointer transition-colors ${current ? bgColor : 'bg-gray-300'} ${disabled ? 'opacity-50' : ''}`}
        />

        <span
          className={`absolute top-1/2 transform -translate-y-1/2 bg-white cursor-pointer rounded-full shadow ${s.knob} ${current ? 'right-1' : 'left-1'}`}
          aria-hidden="true"
        />
      </div>
    </label>
  )
})

Switch.displayName = 'Switch'

export default Switch