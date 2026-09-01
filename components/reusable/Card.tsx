import {ReactNode} from "react";

interface CardProps {
  children: ReactNode
}

const Card = (props: CardProps) => {
  return (
    <div className='max-w-[800px] w-full bg-white rounded-sm p-6'>
      {props.children}
    </div>
  )
}

export default Card