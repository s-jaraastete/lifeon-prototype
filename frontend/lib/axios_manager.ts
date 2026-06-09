import { getSession, signOut } from "next-auth/react";
import { checkExpired } from './jwtTokenHandler';
import { Session } from 'next-auth';
import axiosManagerCore from "./axios_manger_helpers/axios_manager_core";

const redirectIfExpired = async (session: Session | null, useAccessToken: boolean | undefined) => {
  if (!useAccessToken) return
  const refreshToken = session?.refreshToken;
  if (checkExpired(refreshToken ?? null)) {
    signOut({redirect: false});
    const originalUrl = window.location.href  ;
    const locale = window.location.pathname.split('/')[1];
    window.location.href = `/`;
  }
}

interface AxiosManagerOptions {
  useAccessToken?: boolean;
  method: "get" | "post" | "patch" | "put" | "delete";
}
const axiosManager = async (
  path: string,
  payload: null | any,
  options: AxiosManagerOptions
) => {
  const session = await getSession();
  const token = session?.accessToken;
  redirectIfExpired(session, options.useAccessToken);
  const headers = !options.useAccessToken
    ? {}
    : {
        Authorization: `Bearer ${token}`,
      };
  return axiosManagerCore(path, payload, options, headers);
};

export default axiosManager;
