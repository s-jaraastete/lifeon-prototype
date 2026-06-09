'use client'
import {ReactNode} from "react";
import {SessionProvider} from "next-auth/react";

interface NextAuthSessionProviderProps {
  children: ReactNode
};

const NextAuthSessionProvider = (props: NextAuthSessionProviderProps) => {
  return (
    <SessionProvider>
      {props.children}
    </SessionProvider>
  )
};

export default NextAuthSessionProvider;