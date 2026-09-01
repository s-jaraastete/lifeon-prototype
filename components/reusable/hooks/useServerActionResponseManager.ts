'use client'

import { useEffect } from 'react'

type FormActionStatusCallbacks = {
  onSuccess?: (data: any) => void,
  onError?: (data: any) => void,
}

const useServerActionResponseManager = (state: FormActionState | null, responseStatusCallbacks?: FormActionStatusCallbacks) => useEffect(() => {
  if (state === null) return
  if (state.status === 'success') return responseStatusCallbacks?.onSuccess?.(state.data)
  responseStatusCallbacks?.onError?.(state.data)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [state])

export default useServerActionResponseManager