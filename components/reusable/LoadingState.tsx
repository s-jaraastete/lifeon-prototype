import Spinner from "@/components/reusable/Spinner";

const LoadingState = () => {
  return (
    <div className='flex flex-col items-center gap-1'>
      <Spinner/> <span>Cargando Contenidos</span>
    </div>
  )
}

export default LoadingState