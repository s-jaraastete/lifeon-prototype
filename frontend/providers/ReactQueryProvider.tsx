"use client"

import {ReactNode} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient()

interface ReactQueryProviderProps {
  children: ReactNode
}

const ReactQueryProvider = (props: ReactQueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}

export default ReactQueryProvider;