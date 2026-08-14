'use client'
import {ReactNode} from "react";
import type {Session} from "next-auth";
import {SessionProvider} from "next-auth/react";

interface NextAuthSessionProviderProps {
  children: ReactNode,
  session: Session | null,
};

const NextAuthSessionProvider = (props: NextAuthSessionProviderProps) => {
  return (
    <SessionProvider session={props.session}>
      {props.children}
    </SessionProvider>
  )
};

export default NextAuthSessionProvider;
