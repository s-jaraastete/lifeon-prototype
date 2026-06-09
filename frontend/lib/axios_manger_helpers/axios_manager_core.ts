import axios from "axios";
// import { ADMIN_MODULE_API, MOC_BACKEND_HOST } from "../react_query/variables";

interface AxiosManagerOptions {
  useAccessToken?: boolean;
  method: "get" | "post" | "patch" | "put" | "delete";
  module?: "backend" | "admin";
}
const axiosManagerCore = async (
  path: string,
  payload: null | any,
  options: AxiosManagerOptions,
  headers: any
) => {
  const api = {
    backend: process.env.backendHost, //only back host
    admin: process.env.adminModuleAPI,  //only back
  };

  const endpoint = `${api[options.module ?? "backend"]}${path}`;
  const response = await axios({
    method: options.method,
    url: endpoint,
    data: ["post", "patch", "put"].includes(options.method)
      ? payload ?? {}
      : undefined,
    headers: headers,
  });
  return response.data;
};
export default axiosManagerCore;
