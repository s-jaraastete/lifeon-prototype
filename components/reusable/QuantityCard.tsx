type QuantityCardProps = {
  title: string,
  value: number
}

const QuantityCard = (props: QuantityCardProps) => {
  return (
    <div className='text-center py-4 px-6 rounded-xl text-slate-600 shadow-sm bg-slate-100'>
      <p className='mb-2 text-sm'>{props.title}</p>
      <p>{props.value}</p>
    </div>
  )
}

export default QuantityCard