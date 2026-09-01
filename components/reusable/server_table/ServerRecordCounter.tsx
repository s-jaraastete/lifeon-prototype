import { Suspense } from 'react'
import { getServerTableData } from './ServerTableWrapper'

type ServerRecordCounterProps = {
  endpoint: string,
  params?: {
    [key: string]: string
  },
  serverTag?: string[]
}

const ServerRecordCounterCore = async (props: ServerRecordCounterProps) => {
  const data = await getServerTableData<unknown>({
    endpoint: props.endpoint,
    params: new URLSearchParams({...props.params ?? {}}).toString(),
    serverTag: props.serverTag
  })
  
  return (
    <>
      {data.count}
    </>
  )
}

const ServerRecordCounter = async (props: ServerRecordCounterProps) => {
  
  return (
    <Suspense fallback={'...'}>
      <ServerRecordCounterCore {...props} />
    </Suspense>
  )
}


export default ServerRecordCounter