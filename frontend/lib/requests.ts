import {getServerSession} from "next-auth";
import nextAuthOptions from "@/lib/nextAuth/nextAuthOptions";
import {redirect} from "next/navigation";


const redirectIfExpired = async (response: Response) => {
  if (!response.ok && response.status === 401) {
    redirect('/')
  }
}

interface getServerData {
  useAccessToken?: boolean,
  cache?: RequestCache,
  next?: NextFetchRequestConfig
}

interface serverDataOutput {
  code: number,
  data: any
}

/*
  getServerData function is only usable by server component. Do not ever try to use it on client components.
 */
export const getServerData =  async (path: string, options?: getServerData): Promise<serverDataOutput> => {
  let authorization = {}
  if (options?.useAccessToken) {
    const session = await getServerSession(nextAuthOptions)
    authorization = {
      Authorization: `Bearer ${session?.accessToken}`
    }
  }
  const response = await fetch(`${process.env.backendHost}${path}`, {
    headers: {
      ...authorization
    },
    next: options?.next ?? {},
    cache: options?.cache ?? "force-cache"
  })
  await redirectIfExpired(response)
  if (!response.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }
  const data = await response.json()
  return {data, code: response.status}
}

export const postServerData =  async (path: string, options?: getServerData): Promise<serverDataOutput> => {
  let authorization = {}
  if (options?.useAccessToken) {
    const session = await getServerSession(nextAuthOptions)
    authorization = {
      Authorization: `Bearer ${session?.accessToken}`
    }
  }
  const response = await fetch(`${process.env.backendHost}${path}`, {
    method:'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorization
    },
    body: JSON.stringify({}),
    next: options?.next ?? {},
    cache: options?.cache ?? "force-cache"
  })
  if (!response.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }
  const data = await response.json()
  return {data, code: response.status}
}