'use client'

import { useListWrapperQuery } from './ListWrapper'
import { useFilterContext } from './providers/FilterProvider'


const RecordsCounter = () => {
  const {actions} = useFilterContext()

  const response = useListWrapperQuery({
    reactQueryKey: actions.getReactQueryKey(),
    endpoint: actions.getEndpoint(),
    params: actions.getQueryParams()
  })

  const count = (response.data as (any | undefined))?.pages[0].count

  return (
    <>{response.isPending ? 'Cargando...' : count}</>
  )
}

export default RecordsCounter