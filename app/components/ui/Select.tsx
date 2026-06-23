"use client"

import React from "react"

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
	placeholder?: string
	className?: string
	onValueChange?: (value: string) => void
}

const Select: React.FC<SelectProps> = ({ placeholder, className, children, onChange, onValueChange, ...rest }) => {
	const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
		onChange && onChange(e as any)
		onValueChange && onValueChange(e.target.value)
	}

	return (
		<select
			className={className ?? "w-full border border-gray-400 rounded-xl p-3 text-sm text-secondary-text focus:ring-primary focus:border-primary"}
			onChange={handleChange}
			{...rest}
		>
			{placeholder && <option value="">{placeholder}</option>}
			{children}
		</select>
	)
}

export default Select;