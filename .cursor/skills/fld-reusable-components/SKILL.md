---
name: fld-reusable-components
description: Builds Purchase landing (FLD) UI with shared components from components/reusable, including Headless UI Modal layout and deferred state reset on close. Use when implementing FLD pages, modals, forms, or when the user mentions FLD components, reusable, or Modal.tsx.
---

# FLD reusable components

## Import priority

Always prefer **`@/components/reusable/*`** over one-off markup in `app/` (unless no reusable equivalent exists—extend reusable when the pattern will repeat).

Common building blocks: `Button`, `TextInput`, `TextArea`, `Select`, `Modal`, `DataTable`, `FileUploadBox`, `GenericMenu`, `Alert`, server table helpers under `components/reusable/server_table/`, etc.

## Modal (`components/reusable/Modal.tsx`)

```tsx
import Modal, { ModalTitle, ModalBody, ModalActionButtons } from '@/components/reusable/Modal'
```

Headless UI transitions: backdrop ~**200ms**, panel ~**300ms**.

## Deferred reset when modal content is dynamic

Do not reset local state in the same tick as `setOpen(false)`. Call `setOpen(false)` first, then **`setTimeout(resetForm, 250)`** on close and on successful submit when reset would change visible content during the exit animation.

Reference: FPSC `FindingExtensionModal.tsx` (`handleClose` / `onSuccess` + `resetForm` skipping edit mode).

## Checklist

- [ ] UI uses `@/components/reusable` where a component exists.
- [ ] Modal uses `ModalTitle` / `ModalBody` / `ModalActionButtons`.
- [ ] State cleanup deferred ~250ms when needed; guard `isPending` and create vs edit.

## Related

- [fld-server-first-data](../fld-server-first-data/SKILL.md)
- [fld-server-action-mutations](../fld-server-action-mutations/SKILL.md)
