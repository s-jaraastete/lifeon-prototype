---
name: fld-server-first-data
description: Fetches Purchase landing (FLD) data on the server via Server Components, getServerData, and axiosServerManager; minimizes client fetching. Use when building FLD pages, checkout, admin routes, or server components in Purchase landing-page.
---

# FLD server-first data and components

## Priority order

1. **Server Components** (default) — see `AGENTS.md` App Router rules.
2. **Server-only helpers** — `getServerData` (`lib/requests.ts`), `axiosServerManager` (`lib/axios_server_manager.ts`), `ServerTableWrapper` / `getServerTableData` where used.
3. **Server Actions** — mutations (see [fld-server-action-mutations](../fld-server-action-mutations/SKILL.md)).
4. **Client Components** — interactivity only; receive fetched data as props from Server Components.

Avoid `useEffect` + client API load for data that can ship with the page. Do not use client `fetch` to backend for reads when server helpers exist (`AGENTS.md` prefers Axios via `lib/` patterns).

## Rules

- **`getServerData`**: Server Components only.
- **`axiosServerManager`**: Server Components and Server Actions only.
- Never import these into `"use client"` files.

Keep **`"use client"`** low in the tree. Extend backend responses instead of a second client fetch to hydrate missing fields.

## Checklist

- [ ] Initial data loaded on the server.
- [ ] Client children get props, not duplicate mount fetches.
- [ ] Prefer `revalidatePath` / tags after mutations over client refetch duplication.

## Related

- [fld-reusable-components](../fld-reusable-components/SKILL.md)
- `lib/requests.ts`, `lib/axios_server_manager.ts`
