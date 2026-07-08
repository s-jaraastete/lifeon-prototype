import {useInfiniteQuery, UseInfiniteQueryOptions, UseInfiniteQueryResult} from "@tanstack/react-query"
import {useInView} from "react-intersection-observer";
import {useEffect} from "react";

const responseDefaultNextParam = (lastPage: any) => {
  if (lastPage.next === null) return undefined
  return lastPage.next
}

const infinityQueryDefaultArgs = () => {
  return {
    // any values are used for both lastPage and allPages because TQueryFnData could not be imported
    getNextPageParam: (lastPage: any, allPages: any) => {
      return responseDefaultNextParam(lastPage)
    },
  }
}

interface RefInterface {
  ref: (node?: (Element | null | undefined)) => void,
  fdata: any[] | undefined
}

export type UseCustomInifiteQueryResult = UseInfiniteQueryResult<any, unknown> & RefInterface
type UseCustomInfiniteQueryOptions = Omit<UseInfiniteQueryOptions<any, unknown, any, any, any>, 'getNextPageParam' | 'initialPageParam'>  & {
  initialPageParam?: string | number
}

const useCustomInfiniteQuery = (options: UseCustomInfiniteQueryOptions): UseCustomInifiteQueryResult => {
  const {ref, inView} = useInView({threshold: 0.8})

  const response = useInfiniteQuery({
    ...options,
    ...infinityQueryDefaultArgs(),
    initialPageParam: options.initialPageParam ?? 1
  })

  useEffect(() => {
    if (inView) {
      response.fetchNextPage().then()
    }
    // eslint-disable-next-line
  }, [inView])

  const fdata = response.data?.pages.flatMap((page: any) => {
    return page.results
  })

  return {...response, fdata, ref}
}

export default useCustomInfiniteQuery