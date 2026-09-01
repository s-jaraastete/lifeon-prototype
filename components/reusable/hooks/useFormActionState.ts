'use client'

import { serverActionHandler } from '@/lib/serverActionsUtils'
import { useActionState } from 'react'

/**
 * This is a wrapper of useActionState from React 19. The main purpose is to extend the capabilities of this allowing an extra argument being an object or array,
 * types of data that cannot be used in FormData. This also makes `<input type='hidden'/>` unnecesary, making more difficult for users to forge requests.
 * @param other Additional data expected to be used by the server action `action`
 * @param action Server action. Requires three arguments in the following order: `other`, `state` and `formData`
 * @param permalink 
 * @returns [state, formAction, isPending]
 */
const useFormActionState = <OtherPayload>(
  other: OtherPayload,
  action: (other: OtherPayload, state: Awaited<FormActionState> | null, payload: FormData) => FormActionState | Promise<FormActionState>,
  permalink?: string,
) => useActionState(serverActionHandler.bind(null, action, other), null, permalink)

export default useFormActionState