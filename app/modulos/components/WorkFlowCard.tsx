
export interface WorkFlowCardProps {
  id: string;
  title: string;
  description: string;
}

const WorkFlowCard = ({ id, title, description }: WorkFlowCardProps) => {
  return (
    <div className='flex flex-col gap-5.5 w-96.5 items-center'>
      <div>
        <p className={`text-2xl w-12 h-12 bg-teal-100 text-secondary font-semibold flex justify-center items-center rounded-[14px]`}>
          {id}
        </p>
      </div>
      <div className='flex flex-col justify-center items-center gap-2.5'>
        <h2 className='text-base-black text-lg font-semibold'>
          {title}
        </h2>
        <p className='text-primary-text text-center'>
          {description}
        </p>
      </div>
    </div>
  )
};

export default WorkFlowCard;