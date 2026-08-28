'use client'

import { useLoadingLinkContext } from '@/components/reusable/next_link/LoadingLinkProvider'
import { useLinkStatus } from 'next/link'
import { useEffect } from 'react'


const LoadingLinkHelper = () => {
  const {actions} = useLoadingLinkContext()
  const { pending } = useLinkStatus()

  useEffect(() => {
    actions.triggerLoadingBar(pending)
    return () => {
      actions.triggerLoadingBar(false)
    }
  }, [pending])
  
  return (<></>)
}

export default LoadingLinkHelper