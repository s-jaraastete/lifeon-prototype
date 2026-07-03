'use server'

import { getServerData } from '@/lib/requests'


interface PacksResponse {
  results: Pack[]
}

const getBasePack = async (slug: string): Promise<Pack | null> => {
  const { data } = await getServerData(
    `/packs/all/?slug=${encodeURIComponent(slug)}`,
    {
      useAccessToken: false,
      cache: 'no-store',
    },
  ) as { data: PacksResponse }

  return data.results.find((item) => item.slug === slug && item.is_active) ?? data.results[0] ?? null
}

export default getBasePack;
