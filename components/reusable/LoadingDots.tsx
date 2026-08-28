interface LoadingDotsProps {
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'disabled' | 'white',
  size?: 'sm' | 'md'
}

const LoadingDots = (props: LoadingDotsProps) => {
  const color = {
    primary: 'bg-primary-700',
    secondary: 'bg-secondary-600',
    danger: 'bg-red-500',
    success: 'bg-green-600',
    warning: 'bg-amber-500',
    info: 'bg-sky-600',
    disabled: 'bg-zinc-400',
    white: 'bg-gray-200',
  }
  const sizeMapping = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5'
  }
  const gapMapping = {
    sm: 'gap-0.5',
    md: 'gap-1'
  }
  const dotClassName = `${sizeMapping[props.size ?? 'md']} ${color[props.color ?? 'primary']} rounded-full animate-loading-dots`

  return (
    <div className={`inline-flex items-end h-3 ${gapMapping[props.size ?? 'md']}`} role='status' aria-label='Cargando'>
      <span className={`${dotClassName} [animation-delay:-0.28s]`}/>
      <span className={`${dotClassName} [animation-delay:-0.14s]`}/>
      <span className={dotClassName}/>
    </div>
  )
}

export default LoadingDots
