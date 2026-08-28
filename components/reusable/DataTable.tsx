import { ReactNode } from 'react'
import ExpandedTableRow from './ExpandedTableRow'
import TableWrapperCore from './TableWrapperCore'

type DataTableProps<T> = {
  headers: (string | {
    label: string,
    className?: string,
  })[],
  row: (item: T, index?: number) => React.ReactNode,
  data: T[],
  noDataMessage?: ReactNode
  isLoading?: boolean,
  isRowExpanded?: (item: T, index?: number) => boolean
  expandedRow?: (item: T, index?: number) => ReactNode
}

const DataTable = <T, >(props: DataTableProps<T>) => {
  const { isRowExpanded, expandedRow, ...tableProps } = props

  return (
    <TableWrapperCore
      {...tableProps}
      extraRow={expandedRow
        ? (item, index) => (
            <ExpandedTableRow
              colSpan={props.headers.length}
              open={Boolean(isRowExpanded?.(item, index))}
            >
              {expandedRow(item, index)}
            </ExpandedTableRow>
          )
        : undefined
      }
    />
  )
}

export default DataTable
