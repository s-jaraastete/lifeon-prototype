import { ReactNode } from 'react'

type DetailSectionProps = {
  children: ReactNode
}

const DetailSection = (props: DetailSectionProps) => {
  return (
    <div className='bg-slate-100 dark:bg-zinc-700 p-2 rounded p flex flex-col gap-2 h-full'>
      {props.children}
    </div>
  )
}

export default DetailSection