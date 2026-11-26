---
name: fld-server-action-mutations
description: Performs Purchase landing (FLD) writes only through Next.js Server Actions calling axiosServerManager, preferring useFormActionState for forms. Use when changing FLD checkout, admin actions, forms, or POST/PATCH/DELETE in Purchase landing-page.
---

# FLD mutations via Server Actions

## Rule

**All mutations** must use **Server Actions** with **`axiosServerManager`** on the server—not client Axios/`fetch` to `backendHost` for writes.

Examples: `app/checkout/components/actions/`, `app/(auth_admin)/admin/.../subscriptionActions.ts`.

## Forms — prefer `useFormActionState`

Use **`@/components/reusable/hooks/useFormActionState`** + **`@/components/reusable/hooks/useServerActionResponseManager`** when the UI is form-based:

- Action: **`'use server'`**, signature **`(others, prevState, formData)`**, wired through **`serverActionHandler`** (`@/lib/serverActionsUtils`).
- Client: **`useFormActionState(others, action)`**, **`<form action={formAction}>`**.
- Put structured payload in **`others`**, not forgeable hidden JSON fields.

## Non-form flows

Use dedicated **`'use server'`** functions (e.g. checkout one-click start) that call **`axiosServerManager`**—still no client-side API writes.

## User-triggered client requests

See [fld-client-triggered-mutations](../fld-client-triggered-mutations/SKILL.md) for export/download/click-driven API calls with `useMutation`.

## Checklist

- [ ] No new client-side mutation calls to the backend API.
- [ ] Forms use `useFormActionState` when applicable.
- [ ] Cache/path revalidation after success where lists must update.

## Related

- [fld-server-first-data](../fld-server-first-data/SKILL.md)
- [fld-reusable-components](../fld-reusable-components/SKILL.md)
