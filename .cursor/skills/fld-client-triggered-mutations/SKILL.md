---
name: fld-client-triggered-mutations
description: Handles Purchase landing (FLD) user-triggered server requests (exports, downloads, confirm actions) with TanStack useMutation, axiosFetcher or axiosManager, and Button loading via isPending. Use when a click or gesture fires a client-side API call in landing-page, not for form Server Actions.
---

# FLD user-triggered requests with useMutation

Use **`useMutation`** when the user triggers a server request (export, download, one-off POST/DELETE on confirm)—not on mount.

**Form persistence and checkout writes** stay on Server Actions ([fld-server-action-mutations](../fld-server-action-mutations/SKILL.md)).

**Passive reads** on mount use [fld-client-react-query](../fld-client-react-query/SKILL.md) (`useQuery`), not `useMutation`.

## Rules

- Wrap the request in **`mutationFn`**; call **`mutate` / `mutateAsync`** from `onClick` (or confirm handler)—never fire the same request in bare `onClick` without mutation state.
- Surface progress with **`isPending`** (or `mutation.isPending`) on **`Button`** `loading`, disabled controls, and block modal close while pending (see FPSC `ExportKMZButton`, Admin `RemoveUserDialog` patterns in sibling repos).
- **`onSuccess` / `onError`**: notifications via existing providers; **`queryClient.invalidateQueries`** when the action changes data shown by React Query.
- Do **not** use `useEffect` + `fetch` for these flows.

## HTTP in `mutationFn`

| Case | Client helper |
|------|----------------|
| GET returning JSON | `axiosFetcher` (`useAccessToken: true`) |
| POST / PATCH / PUT / DELETE (JSON body or empty) | `axiosManager` with `method` + `useAccessToken: true` |
| File download (blob) | `axios` GET with `responseType: 'blob'` and the same auth headers as `axiosFetcher` / `axiosManager` (or extend shared helper); then `URL.createObjectURL`, `<a download>`, `revokeObjectURL` |

Prefer **`axiosFetcher` / `axiosManager`** over raw **`fetch`** to `backendHost` for Lifeon APIs.

## Template

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import Button from '@/components/reusable/Button'
import axiosFetcher from '@/lib/axios_fetcher'

const ExportButton = () => {
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async () => {
      const response = await axiosFetcher('/export/resource/', { useAccessToken: true })
      return response.data
    },
  })

  return (
    <Button onClick={() => mutate()} loading={isPending} disabled={isPending}>
      Exportar
    </Button>
  )
}
```

Reference: mirror `ExportKMZButton` / `RemoveUserDialog` patterns in Purchase frontend and Admin Panel (`useMutation`, `isPending`, `Button` loading).

## Checklist

- [ ] Trigger is user-driven (click / confirm), not mount.
- [ ] `useMutation` owns loading and error state.
- [ ] `Button` (or equivalent) shows `loading={isPending}` when applicable.
- [ ] Blob downloads revoke object URLs after click.

## Related

- [fld-client-react-query](../fld-client-react-query/SKILL.md)
- [fld-server-action-mutations](../fld-server-action-mutations/SKILL.md)
