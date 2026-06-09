import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: CustomUser,
    expires: string,
    accessToken: string,
    refreshToken: string,
  }

  interface User {
    access: string,
    refresh: string,
    user: CustomUser
  }

  interface Profile {
    access: string,
    refresh: string,
    user: CustomUser
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string,
    refreshToken: string,
    user: CustomUser
  }
}