'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function useNavigationGuard(isDirty: boolean) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const pendingUrlRef = useRef<string | null>(null)
  const navigatingRef = useRef(false)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navigatingRef.current) return
      if (!isDirtyRef.current) return
      const anchor = (e.target as Element).closest('a')
      if (!anchor || anchor.target === '_blank') return
      if (!anchor.href) return
      try {
        const url = new URL(anchor.href)
        if (url.hash && url.pathname === window.location.pathname) return
        if (url.href === window.location.href) return
      } catch {
        return
      }
      e.preventDefault()
      e.stopImmediatePropagation()
      pendingUrlRef.current = anchor.href
      setOpen(true)
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  const cancel = () => {
    setOpen(false)
    pendingUrlRef.current = null
  }

  const proceed = () => {
    navigatingRef.current = true
    setOpen(false)
    if (pendingUrlRef.current) {
      router.push(pendingUrlRef.current)
    }
    pendingUrlRef.current = null
    setTimeout(() => {
      navigatingRef.current = false
    }, 2000)
  }

  return { open, cancel, proceed }
}
