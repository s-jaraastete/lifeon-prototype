import { XMarkIcon } from '@heroicons/react/24/outline';
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

export type ChipColor = 'primary' | 'secondary' | 'info' | 'warning' | 'danger' | 'default' | 'success'
export type ChipAppearance = 'soft' | 'solid' | 'outline'
export type ChipSize = 'xs' | 'sm' | 'md'
/** @deprecated Prefer ChipColor. Kept for existing imports. */
export type ChipVariants = ChipColor

type ChipProps = (ChipButtonProps | ChipNoButtonProps) & {
  label: string | any,
  icon?: ReactElement<any, any>,
  variant?: ChipColor,
  appearance?: ChipAppearance,
  size?: ChipSize,
}

const CHIP_CLASS_NAMES: Record<ChipColor, Record<ChipAppearance, string>> = {
  primary: {
    soft: 'chip-primary',
    solid: 'chip-primary-solid',
    outline: 'chip-primary-outline',
  },
  secondary: {
    soft: 'chip-secondary',
    solid: 'chip-secondary-solid',
    outline: 'chip-secondary-outline',
  },
  info: {
    soft: 'chip-info',
    solid: 'chip-info-solid',
    outline: 'chip-info-outline',
  },
  warning: {
    soft: 'chip-warning',
    solid: 'chip-warning-solid',
    outline: 'chip-warning-outline',
  },
  danger: {
    soft: 'chip-danger',
    solid: 'chip-danger-solid',
    outline: 'chip-danger-outline',
  },
  default: {
    soft: 'chip-default',
    solid: 'chip-default-solid',
    outline: 'chip-default-outline',
  },
  success: {
    soft: 'chip-success',
    solid: 'chip-success-solid',
    outline: 'chip-success-outline',
  },
}

const CHIP_BUTTON_CLASS_NAMES: Record<ChipColor, Record<ChipAppearance, string>> = {
  primary: {
    soft: 'chip-button-primary',
    solid: 'chip-button-primary-solid',
    outline: 'chip-button-primary',
  },
  secondary: {
    soft: 'chip-button-secondary',
    solid: 'chip-button-secondary-solid',
    outline: 'chip-button-secondary',
  },
  info: {
    soft: 'chip-button-info',
    solid: 'chip-button-info-solid',
    outline: 'chip-button-info',
  },
  warning: {
    soft: 'chip-button-warning',
    solid: 'chip-button-warning-solid',
    outline: 'chip-button-warning',
  },
  danger: {
    soft: 'chip-button-danger',
    solid: 'chip-button-danger-solid',
    outline: 'chip-button-danger',
  },
  default: {
    soft: 'chip-button-default',
    solid: 'chip-button-default-solid',
    outline: 'chip-button-default',
  },
  success: {
    soft: 'chip-button-success',
    solid: 'chip-button-success-solid',
    outline: 'chip-button-success',
  },
}

const SIZE_CONFIG = {
  xs: {
    chip: 'h-[22px] px-3 py-0.5 text-micro font-medium leading-[18px]',
    icon: 'size-3',
  },
  sm: {
    chip: 'h-[26px] px-3 py-0.5 text-body-sm font-normal leading-[22px]',
    icon: 'size-3.5',
  },
  md: {
    chip: 'h-7 px-3 py-0.5 text-body-md font-normal leading-6',
    icon: 'size-4',
  },
} as const

const Chip = (props: ChipProps) => {
  const color = props.variant ?? 'default'
  const appearance = props.appearance ?? 'soft'
  const size = props.size ?? 'sm'
  const sizeClasses = SIZE_CONFIG[size]

  return (
    <span className={clsx('chip-common', sizeClasses.chip, CHIP_CLASS_NAMES[color][appearance])}>
      {props.icon &&
        <span className={clsx('flex shrink-0 items-center justify-center [&>svg]:size-full', sizeClasses.icon)}>
          {props.icon}
        </span>
      }
      <span>{props.label}</span>
      {props.onClick &&
        <button
          type="button"
          className={clsx(
            'flex shrink-0 cursor-pointer items-center justify-center',
            sizeClasses.icon,
            CHIP_BUTTON_CLASS_NAMES[color][appearance],
          )}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            props.onClick()
          }}
          aria-label="Quitar"
        >
          {props.buttonIcon ?? <XMarkIcon className="size-full" />}
        </button>
      }
    </span>
  )
}

export default Chip
