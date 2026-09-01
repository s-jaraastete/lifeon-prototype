import useCustomInfiniteQuery from "@/hooks/useCustomInfiniteQuery";
import axiosManager from "@/lib/axios_manager";
import LoadingState from "@/components/reusable/LoadingState";
import InformationCard from "@/components/reusable/InformationCard";
import {InformationCircleIcon} from "@heroicons/react/24/solid";
import PageObserver from "@/components/reusable/PageObserver";
import {Fragment, ReactNode} from "react";

type HideNoDataMessageProps = {
  hideNoDataMessage: true
}

type ShowNoDataMessageProps = {
  hideNoDataMessage?: false,
  noDataMessage: string,
}

type useListWrapperQueryArgs = {
  reactQueryKey: string[],
  endpoint: string,
  params?: string,
}

export const useListWrapperQuery = (args: useListWrapperQueryArgs) => useCustomInfiniteQuery({
  queryKey: args.reactQueryKey,
  queryFn: async ({pageParam = '1'}) => {
    const propsQueryParams = new URLSearchParams(args.params ?? '')
    const queryParams = new URLSearchParams({
      page: pageParam as string,
      ...Object.fromEntries(propsQueryParams)
    })
    return axiosManager(`${args.endpoint}?${queryParams.toString()}`, null, {useAccessToken: true, method: 'get'})
  }
})

type ListWrapperProps<TData> = (HideNoDataMessageProps | ShowNoDataMessageProps) & {
  params?: string,
  endpoint: string,
  reactQueryKey: string[],
  item: (item: TData, index: number, currentDataLength: number, totalDataLength: number) => ReactNode
  hideEndReachedMessage?: boolean,
}

const ListWrapper = <TData extends {id: number},>(props: ListWrapperProps<TData>) => {

  const response = useListWrapperQuery({
    reactQueryKey: props.reactQueryKey,
    endpoint: props.endpoint,
    params: props.params,
  })

  if (response.isLoading) {
    return (
      <div className='my-10'>
        <LoadingState/>
      </div>
    )
  }

  const data: TData[] = response.fdata ?? []

  if (data.length === 0 && !props.hideNoDataMessage) {
    return (
      <div className='my-3'>
        <InformationCard variant='info' icon={<InformationCircleIcon/>}>
          <p>{props.noDataMessage}</p>
        </InformationCard>
      </div>
    )
  }

  return (
    <>
      {data.map((item, index) => (
        <Fragment key={`${props.reactQueryKey.join('-')}-item-${item.id}`}>
          {props.item(item, index, data.length, response.data.pages[0].count)}
        </Fragment>
      ))}
      <PageObserver query={response}/>
    </>
  )
}

export default ListWrapper