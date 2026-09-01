'use client'

import axiosManager from '@/lib/axios_manager'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import React, { ReactNode, useState } from 'react'
import TableWrapperCore from './TableWrapperCore'

type PageTableControlsProps = {
  page: number,
  setPage: (page: number) => void,
  lastPage: number,
  isLoading: boolean,
}

const PaginationEllipsis = () => (
  <span className='px-1 text-body-sm leading-[22px] text-gray-600'>...</span>
)

export const PageTableControls = ({page, setPage, lastPage, isLoading}: PageTableControlsProps) => {
  const atStart = page <= 1 || lastPage === 0
  const atEnd = page >= lastPage || lastPage === 0

  return (
    <div className='flex items-center gap-2'>
      <PaginationButton
        aria-label='Primera página'
        onClick={() => setPage(1)}
        disabled={atStart || isLoading}
        icon
      >
        <ChevronDoubleLeftIcon className='size-4' />
      </PaginationButton>
      <PaginationButton
        aria-label='Página anterior'
        onClick={() => setPage(page - 1)}
        disabled={atStart || isLoading}
        icon
      >
        <ChevronLeftIcon className='size-4' />
      </PaginationButton>
      {lastPage <= 5 ? (
        Array.from({ length: lastPage }, (_, i) => (
          <PaginationButton
            key={i + 1}
            onClick={() => setPage(i + 1)}
            disabled={isLoading}
            active={page === i + 1}
          >
            {i + 1}
          </PaginationButton>
        ))
      ) : (
      <>
        <PaginationButton
          onClick={() => setPage(1)}
          disabled={isLoading}
          active={page === 1}
        >
          1
        </PaginationButton>
        {page > 3 && <PaginationEllipsis />}
        {page > 2 && page < lastPage - 1 && (
        <>
          <PaginationButton onClick={() => setPage(page - 1)} disabled={isLoading}>
            {page - 1}
          </PaginationButton>
          <PaginationButton onClick={() => setPage(page)} disabled={isLoading} active>
            {page}
          </PaginationButton>
          <PaginationButton onClick={() => setPage(page + 1)} disabled={isLoading}>
            {page + 1}
          </PaginationButton>
        </>
        )}
        {page <= 2 && (
        <>
          <PaginationButton onClick={() => setPage(2)} disabled={isLoading} active={page === 2}>
            2
          </PaginationButton>
          <PaginationButton onClick={() => setPage(3)} disabled={isLoading} active={page === 3}>
            3
          </PaginationButton>
        </>
        )}
        {page >= lastPage - 2 && (
        <>
          <PaginationButton onClick={() => setPage(lastPage - 2)} disabled={isLoading} active={page === lastPage - 2}>
            {lastPage - 2}
          </PaginationButton>
          <PaginationButton onClick={() => setPage(lastPage - 1)} disabled={isLoading} active={page === lastPage - 1}>
            {lastPage - 1}
          </PaginationButton>
        </>
        )}
        {page < lastPage - 2 && <PaginationEllipsis />}
        <PaginationButton
          onClick={() => setPage(lastPage)}
          disabled={isLoading}
          active={page === lastPage}
        >
          {lastPage}
        </PaginationButton>
      </>
      )}
      <PaginationButton
        aria-label='Página siguiente'
        onClick={() => setPage(page + 1)}
        disabled={atEnd || isLoading}
        icon
      >
        <ChevronRightIcon className='size-4' />
      </PaginationButton>
      <PaginationButton
        aria-label='Última página'
        onClick={() => setPage(lastPage)}
        disabled={atEnd || isLoading}
        icon
      >
        <ChevronDoubleRightIcon className='size-4' />
      </PaginationButton>
    </div>
  )
}

type PaginationButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  icon?: boolean
  children: ReactNode
}

const PaginationButton = ({active, icon, children, className, ...props}: PaginationButtonProps) => {
  return (
    <button
      className={clsx(
        'inline-flex h-8 items-center justify-center rounded-lg text-body-sm font-medium leading-none transition-colors',
        icon ? 'w-8' : 'min-w-8 px-2.5',
        props.disabled && 'cursor-not-allowed bg-gray-100 text-gray-400',
        !props.disabled && active && 'bg-secondary-50 text-secondary-700',
        !props.disabled && !active && 'cursor-pointer border border-gray-300 bg-white text-gray-800 hover:bg-gray-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}


type TableWrapperProps<T> = {
  headers: (string | {
    label: string,
    className?: string,
  })[],
  row: (item: T, index?: number) => React.ReactNode,
  endpoint: string,
  params?: {
    [key: string]: string
  },
  reactQueryKey: string[],
}

type useTableWrapperQueryArgs = {
  reactQueryKey: string[],
  endpoint: string,
  params?: string,
}

export const useTableWrapperQuery = <T, >(args: useTableWrapperQueryArgs) => {
  return useQuery({
    queryKey: args.reactQueryKey,
    queryFn: async () => axiosManager(`${args.endpoint}?${args.params}`, null, {useAccessToken: true, method: 'get'}) as Promise<{results: T[], count: number}>,
  })
}

const TableWrapper = <T, >(props: TableWrapperProps<T>) => {
  const [page, setPage] = useState<number>(1)
  const pageSize = 10
  const params = new URLSearchParams({...props.params ?? {}, page: page.toString(), page_size: pageSize.toString()}).toString()
  // const { data, isLoading} = useQuery({
  //   queryKey: props.reactQueryKey,
  //   queryFn: async () => axiosManager(`${props.endpoint}?${params}`, null, {useAccessToken: true, method: 'get'}) as Promise<{results: T[], count: number}>,
  // })
  const { data, isLoading } = useTableWrapperQuery<T>({
    reactQueryKey: [...props.reactQueryKey, page.toString()], // TODO - Modify the filter provider to work with pages and evaluate the possibility of handling
                                                              // the page parameter from there
    endpoint: props.endpoint,
    params: params,
  })
  const lastPage = Math.ceil((data?.count ?? 0) / pageSize)

  // console.log('TableWrapper react query key', props.reactQueryKey)
  // console.log('TableWrapper data', data)
  
  
  return (
    <>
      <TableWrapperCore 
        headers={props.headers}
        row={props.row}
        data={data?.results ?? []}
        isLoading={isLoading}
      />
      <div className='pt-4'/>
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
        <PageTableControls
          page={page}
          setPage={setPage}
          lastPage={lastPage}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}

export default TableWrapper