import LoadingState from '@/components/reusable/LoadingState'
import clsx from 'clsx'
import { Fragment, ReactNode } from 'react'
import TableRoot from './TableRoot'

type TableWrapperCoreProps<T> = {
  headers: (string | {
    label: string,
    className?: string,
  })[],
  row: (item: T, index?: number) => React.ReactNode,
  data: T[],
  isLoading?: boolean,
  noDataMessage?: ReactNode
  extraRow?: (item: T, index?: number) => ReactNode
  stickyLastColumns?: 1 | 2
}

const TableWrapperCore = <T, >(props: TableWrapperCoreProps<T>) => {
  return (
    <div className='overflow-x-auto rounded-lg border border-gray-300 bg-white'>
        <TableRoot
          stickyRightColumns={props.stickyRightColumns}
          className={clsx(
            'w-full',
            props.stickyLastColumns === 1 && 'sticky-last-column',
            props.stickyLastColumns === 2 && 'sticky-last-two-columns',
          )}
        >
        <thead>
          <tr>
            {props.headers.map((header, idx) => 
              <th
                key={typeof(header) === 'string' ? header : header.label}
                className={clsx(
                'h-12.5whitespace-nowrap border-b border-gray-300 px-5 py-2.5 text-left text-body-sm font-medium leading-5.5 text-gray-950',
                !props.stickyLastColumns
                  && idx === props.headers.length - 1
                  && (typeof header === 'string' || !header.className)
                  && 'w-1',
                typeof(header) === 'string' ? '' : header.className ?? ''
                )}
              >
                {typeof(header) === 'string' ? header: header.label}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {(props.isLoading || props.data === undefined) ? (
            <tr>
              <td colSpan={props.headers.length} className='py-4 text-center'>
                <div className='py-40'><LoadingState /></div>
              </td>
            </tr>
          ) : !props.isLoading && props.data.length === 0 ? (
            <tr>
              <td colSpan={props.headers.length} className='px-5 py-10 text-center text-body-sm text-gray-800'>
                {props.noDataMessage !== undefined ? props.noDataMessage : 'No hay datos para mostrar.'}
              </td>
            </tr>
          ) : (
            props.data.map((item, index) => (
              <Fragment key={index}>
                <tr className='whitespace-nowrap border-b border-gray-300 align-middle last:border-none hover:bg-gray-100 [&>td]:min-h-[50px] [&>td]:px-5 [&>td]:py-2.5 [&>td]:text-body-sm [&>td]:leading-[22px] [&>td]:text-gray-800'>
                  {props.row(item, index)}
                </tr>
                {props.extraRow?.(item, index)}
              </Fragment>
            ))
          )}
        </tbody>
        </TableRoot>
    </div>
  )
}

export default TableWrapperCore
