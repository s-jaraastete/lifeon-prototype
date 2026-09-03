import React, { ReactNode, Suspense } from 'react'
import TableWrapperCore from './TableWrapperCore'
import { getServerData } from '@/lib/requests'
import ServerPageTableControls from './ServerPageTableControls'

type GetServerTableDataArgs = {
  endpoint: string,
  params: string,
  serverTag?: string[]
}

type DjangoGenericPaginationResponse<T> = {
  count: number,
  next: number | null,
  previous: number | null,
  results: T[]
}

export const getServerTableData = async <T, >(args: GetServerTableDataArgs): Promise<DjangoGenericPaginationResponse<T>> => {
  const response = await getServerData(
    `${args.endpoint}?${args.params}`, 
    {useAccessToken: true, ...args.serverTag !== undefined ? {next: {tags: args.serverTag}} : {cache: 'no-cache'}}
  )
  return response.data
}

type ServerPaginationProps = {
  endpoint: string,
  pageSize: number,
  params?: {
    [key: string]: string
  },
  serverTag?: string[]
}

const ServerPagination = async (props: ServerPaginationProps) => {
  const pageSize = props.pageSize
  const page = Number(props.params?.page) || 1
  const params = new URLSearchParams({...props.params ?? {}, page: page.toString(), page_size: pageSize.toString()}).toString()
  const data = await getServerTableData({
    endpoint: props.endpoint,
    params,
    serverTag: props.serverTag
  })
  
  return (
    <div className='flex items-center justify-between'>
      <p className='text-body-sm leading-[22px] text-gray-800'>
        Mostrando{' '}
        <span className='font-semibold text-gray-950'>
          {data && data.count > 0
            ? `${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, data.count)}`
            : '0'
          }
        </span>
        {' '}de{' '}
        <span className='font-semibold text-gray-950'>{data?.count ?? '...'}</span>
        {' '}resultados
      </p>
      <ServerPageTableControls totalCount={data.count} pageSize={props.pageSize}/>
    </div>
  )
}


type ServerTableDataProps<T> = {
  headers: (string | {
    label: string,
    className?: string,
  })[],
  row: (item: T, index?: number) => React.ReactNode,
  endpoint: string,
  pageSize: number,
  params?: {
    [key: string]: string
  },
  serverTag?: string[],
  noDataMessage?: ReactNode,
  stickyLastColumn?: boolean
}

const ServerTableData = async <T, >(props: ServerTableDataProps<T>) => {
  const pageSize = props.pageSize
  const page = props.params?.page ?? 1
  const params = new URLSearchParams({...props.params ?? {}, page: page.toString(), page_size: pageSize.toString()}).toString()
  const data = await getServerTableData<T>({
    endpoint: props.endpoint,
    params,
    serverTag: props.serverTag
  })
  
  return (
    <>
      <TableWrapperCore 
        headers={props.headers}
        row={props.row}
        data={data.results}
        isLoading={false}
        noDataMessage={props.noDataMessage}
        stickyLastColumn={props.stickyLastColumn}
      />
    </>
  )
}


type ServerTableWrapperProps<T> = {
  headers: (string | {
    label: string,
    className?: string,
  })[],
  row: (item: T, index?: number) => React.ReactNode,
  endpoint: string,
  pageSize: number,
  params?: {
    [key: string]: string
  },
  serverTag?: string[],
  noDataMessage?: ReactNode,
  stickyLastColumn?: boolean
}

const ServerTableWrapper = <T, >(props: ServerTableWrapperProps<T>) => {
  
  return (
    <>
      <Suspense
        fallback={
          <TableWrapperCore
            headers={props.headers}
            row={props.row}
            data={[]}
            isLoading
          />}
      >
        <ServerTableData  
          {...props}
        />
      </Suspense>
      <div className='pt-4'/>
      <Suspense>
        <ServerPagination
          endpoint={props.endpoint}
          pageSize={props.pageSize}
          params={props.params}
          serverTag={props.serverTag}
        />
      </Suspense>      
    </>
  )
}

export default ServerTableWrapper