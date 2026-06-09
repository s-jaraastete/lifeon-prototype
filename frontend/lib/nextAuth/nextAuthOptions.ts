import {NextAuthOptions} from 'next-auth'
import {checkExpired} from "../jwtTokenHandler";
import CredentialsProvider from "next-auth/providers/credentials";

const cookieNamePrefix = process.env.COOKIES_NAME_PREFIX ?? 'localhost_frontend'

const refreshAccessToken = async (refreshToken: string) => {
  const host = process.env.backendHost;
  const payload = {
    refresh: refreshToken
  }
  const res = await fetch(`${host}/token/refresh/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  })
  const accessToken = await res.json()
  if (res.ok && accessToken) {
    return accessToken.access
  }
  return null
}

const nextAuthOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  pages: {
    error: '/'
  },
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        const host = process.env.backendHost;
        const res = await fetch(`${host}/token/`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })
        const user = await res.json()

        // If no error and we have user data, return it
        if (res.ok && user) {
          return user
        }
        // Return null if user data could not be retrieved
        return null
      },
    }),
  ],
  secret: 'f3y=txg=k9_!vb=6duyv^02jlryh%m9q*%bzas$tsjj^l=-467',
  callbacks: {
    async session({session, token}) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.user = token.user
      return session
    },
    async jwt({token, user}) {
      if (user !== undefined) {
        token.accessToken = user.access;
        token.refreshToken = user.refresh;
        token.user = user.user;
      }
      if (checkExpired(token.accessToken)) {
        token.accessToken = await refreshAccessToken(token.refreshToken);
        return token;
      }
      return token
    }
  },
  cookies: {
    sessionToken: {
      name: `${cookieNamePrefix}.session-token`,
      options: {
        domain: process.env.DOMAIN ?? 'localhost',
        sameSite: 'lax',
        path: '/',
        secure: true,
        httpOnly: true
      }
    },
    csrfToken: {
      name: `${cookieNamePrefix}.csrf-token`,
      options: {
        domain: process.env.DOMAIN ?? 'localhost',
        sameSite: 'lax',
        path: '/',
        secure: true,
        httpOnly: true
      }
    }
  }
}

export default nextAuthOptions