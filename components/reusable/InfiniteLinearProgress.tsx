import React from "react";

type InfiniteLinearProgressProps = {
  label?: string
}

const InfiniteLinearProgress = (props: InfiniteLinearProgressProps) => {
  return (
    <div className=' flex items-center flex-col w-full'>
      <div className="w-full bg-primary-100 rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full w-[40%] animate-linear_progress"></div>
      </div>
      <p className='pt-2'>{props.label ?? 'Cargando Archivo...'}</p>
    </div>
  )
}

export default InfiniteLinearProgress