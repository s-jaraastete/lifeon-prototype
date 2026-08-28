'use client'
import { useRef } from 'react'

/**
 * Tracks whether a form's current state differs from its last-saved baseline.
 * WARNING: Use this only when the data is present on the first render (on mount), 
 * usually this is always true when the data comes from a server component
 *
 * @param currentSnapshot - JSON.stringify of the current payload, updated every render.
 *   The value from the very first call seeds the saved baseline automatically.
 * @returns
 *   - `isDirty`              – true when current snapshot differs from the saved baseline.
 *   - `markSaved()`          – call in mutation onSuccess to move the baseline forward.
 *   - `scheduleBaselineReset()` – call when server data is about to replace local state
 *     (e.g. inside a useEffect that resets array items with real server IDs). On the next
 *     render the baseline will be reset to the incoming snapshot before isDirty is computed.
 */
export function useDirtyState(currentSnapshot: string) {
  const initialSnapshotRef = useRef(currentSnapshot)
  const currentSnapshotRef = useRef(currentSnapshot)
  currentSnapshotRef.current = currentSnapshot

  const pendingResetRef = useRef(false)
  if (pendingResetRef.current) {
    initialSnapshotRef.current = currentSnapshot
    pendingResetRef.current = false
  }

  const isDirty = currentSnapshot !== initialSnapshotRef.current

  const markSaved = () => {
    initialSnapshotRef.current = currentSnapshotRef.current
  }

  const scheduleBaselineReset = () => {
    pendingResetRef.current = true
  }

  return { isDirty, markSaved, scheduleBaselineReset }
}
