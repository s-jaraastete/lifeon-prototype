'use client'

import { getSession } from 'next-auth/react'

const openAuthenticatedFile = async (authFileUrl: string): Promise<void> => {
  if (authFileUrl.startsWith('blob:')) {
    window.open(authFileUrl, '_blank', 'noopener,noreferrer')
    return
  }

  // Reserve the tab while the click still counts as user activation: browsers block
  // popups opened after the awaited fetch resolves, so only the first one would open.
  const fileWindow = window.open('', '_blank')

  try {
    const session = await getSession()
    const response = await fetch(authFileUrl, {
      headers: {
        Authorization: `Bearer ${session?.accessToken ?? ''}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch protected file')
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    if (fileWindow) {
      fileWindow.location.replace(objectUrl)
      return
    }
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
  } catch (error) {
    fileWindow?.close()
    throw error
  }
}

export default openAuthenticatedFile
