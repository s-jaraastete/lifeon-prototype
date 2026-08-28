import React, {ReactElement} from "react";
import clsx from 'clsx';
import Spinner from './Spinner';

type ButtonColor = 'primary' | 'danger' | 'secondary' | 'success' | 'tertiary'
type ButtonVariant = 'filled' | 'light' | 'subtle' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactElement<any, any>,
  rightIcon?: ReactElement<any, any>
  className?: string,
  iconclassname?: string
  color?: ButtonColor,
  variant?: ButtonVariant,
  loading?: boolean,
  size?: ButtonSize
}

const colorConfig: Record<ButtonColor, Record<ButtonVariant, string>> = {
  primary: {
    filled: 'btn-primary-filled',
    light: 'btn-primary-light',
    subtle: 'btn-primary-subtle',
    outline: 'btn-primary-outline',
  },
  danger: {
    filled: 'btn-danger-filled',
    light: 'btn-danger-light',
    subtle: 'btn-danger-subtle',
    outline: 'btn-danger-outline',
  },
  success: {
    filled: 'btn-success-filled',
    light: 'btn-success-light',
    subtle: 'btn-success-subtle',
    outline: 'btn-success-outline',
  },
  secondary: {
    filled: 'btn-secondary-filled',
    light: 'btn-secondary-light',
    subtle: 'btn-secondary-subtle',
    outline: 'btn-secondary-outline',
  },
  tertiary: {
    filled: 'btn-tertiary-filled',
    light: 'btn-tertiary-light',
    subtle: 'btn-tertiary-subtle',
    outline: 'btn-tertiary-outline',
  },
}

const sizeConfig = {
  padding: {
    sm: 'btn-common-sm',
    md: 'btn-common-md',
    lg: 'btn-common-lg',
  },
  iconOnly: {
    sm: 'btn-icon-sm',
    md: 'btn-icon-md',
    lg: 'btn-icon-lg',
  },
  iconSize: {
    sm: 'flex size-4 shrink-0 items-center justify-center [&>svg]:size-full',
    md: 'flex size-5 shrink-0 items-center justify-center [&>svg]:size-full',
    lg: 'flex size-6 shrink-0 items-center justify-center [&>svg]:size-full',
  },
} as const

const Button = ({
  icon,
  rightIcon,
  children,
  className,
  disabled,
  loading,
  size = 'md',
  type,
  color = 'primary',
  variant = 'filled',
  iconclassname,
  ...props
}: ButtonProps) => {
  const loadingDisabled = loading || disabled
  const isIconOnly = Boolean((icon || rightIcon || loading) && !children)
  const spinnerColor = variant === 'filled' && color !== 'tertiary' ? 'inverse' : 'primary'
  const spinner = (
    <Spinner size={size === 'lg' ? 'md' : size} color={spinnerColor} />
  )

  return (
    <button
      className={clsx(
        sizeConfig.padding[size],
        isIconOnly && sizeConfig.iconOnly[size],
        colorConfig[color][variant],
        loading && 'cursor-wait',
        className,
      )}
      {...props}
      disabled={loadingDisabled}
      type={type ?? 'button'}
    >
      {loading ? spinner : icon ? (
        <div className={clsx(sizeConfig.iconSize[size], iconclassname)}>{icon}</div>
      ) : null}
      {children && <span className="whitespace-nowrap">{children}</span>}
      {rightIcon && (
        <div className={clsx(sizeConfig.iconSize[size], iconclassname)}>{rightIcon}</div>
      )}
    </button>
  )
}

export default Button
