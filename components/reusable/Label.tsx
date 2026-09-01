interface LabelProps {
  label?: string,
  required?: boolean
}

const Label = (props: LabelProps) => {
  if (props.label === undefined) return <></>
  return (
    <p className='p font-semibold'>{props.label}{props.required && <span className='text-red-600 ml-0.5'>*</span>}</p>
  )
}

export default Label