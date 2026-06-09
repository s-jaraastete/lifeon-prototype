import { getServerSession } from "next-auth";
import axiosManagerCore from "../lib/axios_manger_helpers/axios_manager_core";
import nextAuthOptions from "./nextAuth/nextAuthOptions";

interface AxiosManagerOptions {
  useAccessToken?: boolean,
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  module?: "backend" | "admin",
}

const axiosServerManager = async (path: string, payload: null | any, options: AxiosManagerOptions) => {
  // path must begin with /
  // In this case, automatic log out will not be implemented because of data loss on form after log out. Its better off to throw an error 
  // let it save its data and then log out
  const headers = !options.useAccessToken ? {} : {
    Authorization: `Bearer ${(await getServerSession(nextAuthOptions))?.accessToken}`
  }
  // const headers = undefined
  return axiosManagerCore(path, payload, options, headers)
}

export default axiosServerManager