'use server'

import { getServerData } from '@/lib/requests'

export interface UfInfo {
  value: number
  date: string
  source: 'api' | 'cache'
  stale: boolean
}

const getUF = async (): Promise<UfInfo> => {
  const { data } = await getServerData('/exchange/uf/', {
    useAccessToken: false,
    cache: 'no-store',
  }) as { data: UfInfo }

  return data
}

export default getUF;