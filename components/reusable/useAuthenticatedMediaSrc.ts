'use client'

import { useEffect, useState } from 'react'
import { getSession } from 'next-auth/react'

const useAuthenticatedMediaSrc = (authUrl: string | null): string | null => {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!authUrl) {
      setSrc(null)
      return
    }

    if (authUrl.startsWith('blob:')) {
      setSrc(authUrl)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      try {
        const session = await getSession()
        const response = await fetch(authUrl, {
          headers: {
            Authorization: `Bearer ${session?.accessToken ?? ''}`,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch protected media')
        const blob = await response.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch {
        if (!cancelled) setSrc(null)
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [authUrl])

  return src
}

export default useAuthenticatedMediaSrc
