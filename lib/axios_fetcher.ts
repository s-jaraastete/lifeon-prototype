import axios from "axios"
import {getSession} from "next-auth/react";

interface AxiosFetcherOptions {
  useAccessToken: boolean,
  page?: number,
  domain?: string
}

const parsePaginationEndpoint = (endpoint: string, page: number) => {
  if (endpoint.includes('?')) return endpoint.concat(`&page=${page}`)
  return endpoint.concat(`?page=${page}`)
}

const axiosFetcher = async (endpoint: string, options?: AxiosFetcherOptions) => {
  let fullEndpoint = `${options?.domain ?? process.env.backendHost}${endpoint}`
  if (options?.page !== undefined) {
    fullEndpoint = parsePaginationEndpoint(fullEndpoint, options.page)
  }
  if (options?.useAccessToken === undefined) return axios.get(fullEndpoint)
  if (options.useAccessToken) {
    const session = await getSession()
    return axios.get(fullEndpoint,  {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`
      }
    })
  }
  return axios.get(fullEndpoint)
}

export default axiosFetcher