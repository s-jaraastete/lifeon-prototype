interface SpinnerProps {
  color?: 'primary' | 'disabled' | 'inverse',
  size?: 'sm' | 'md'
}

const Spinner = (props: SpinnerProps) => {
  const color = {
    primary: 'fill-primary-500',
    disabled: 'fill-gray-500',
    inverse: 'fill-white',
  }
  const opacity = {
    primary: '0.25',
    disabled: '0.50',
    inverse: '0.25',
  }
  const sizeMapping = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  }

  return (
    <div className={`${sizeMapping[props.size ?? 'md']} animate-spin`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={color[props.color ?? 'primary']} viewBox="0 0 24 24">
        <path xmlns="http://www.w3.org/2000/svg"
              d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity={opacity[props.color ?? 'primary']}/>
        <path xmlns="http://www.w3.org/2000/svg"
              d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
              />
      </svg>
    </div>
  )
}

export default Spinner