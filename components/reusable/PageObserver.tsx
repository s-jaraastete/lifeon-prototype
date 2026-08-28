'use client'

import {UseCustomInifiteQueryResult} from "@/components/hooks/useCustomInfiniteQuery";
import Button from "@/components/reusable/Button";
import {ArrowPathIcon, ExclamationTriangleIcon} from "@heroicons/react/24/solid";

interface PageObserverProps {
  query: UseCustomInifiteQueryResult,
  hideEndReachedMessage?: boolean
}

const PageObserver = (props: PageObserverProps) => {
  if (props.query.hasNextPage) {
    return (
      <div className='flex justify-center mt-6' ref={props.query.ref}>
        <Button variant='light' icon={<ArrowPathIcon/>} disabled={!props.query.hasNextPage} loading={props.query.isFetching}>Cargar más</Button>
      </div>
    )
  }
  if (props.hideEndReachedMessage) {
    return (<></>)
  }
  return (
    <p className='bg-yellow-50 px-6 py-4 rounded-sm text-yellow-700 my-4 flex gap-2'>
      <span><ExclamationTriangleIcon className='w-6 h-6'/></span>
      <span>
        Ha alcanzado el final de la lista. Si cree que ha llegado un nuevo registro, recargue la página e intente nuevamente.
      </span>
    </p>
  )
}

export default PageObserver