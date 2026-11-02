---
name: fld-client-react-query
description: Loads Purchase landing (FLD) data in Client Components with TanStack React Query (useQuery, useInfiniteQuery, useMutation) and axiosFetcher; forbids useEffect plus fetch. Use when server-first loading is impossible and client-side reads or refetches are required in landing-page.
---

# FLD client-side data with React Query

Prefer [fld-server-first-data](../fld-server-first-data/SKILL.md) first. Use this skill **only when** data must load or refetch in the browser (search-as-you-type, infinite scroll, polling, browser-only APIs, post-interaction refetch without a server refresh).

## Required stack

- **React Query** — `useQuery`, `useInfiniteQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`.
- **HTTP** — `axiosFetcher` from `@/lib/axios_fetcher` inside `queryFn` / `mutationFn`.

Do **not** use `useEffect` + `fetch` (or `useEffect` + manual `axios`) to load API data. Do **not** use native `fetch` for Lifeon/backend APIs when `axiosFetcher` applies.

## Patterns

**Standard read**

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import axiosFetcher from '@/lib/axios_fetcher'

const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  enabled: Boolean(id),
  queryFn: async () => {
    const response = await axiosFetcher(`/resource/${id}/`, {
      useAccessToken: true,
    })
    return response.data
  },
})
```

**Paginated / autocomplete lists** — reuse `useCustomInfiniteQuery` from `@/hooks/useCustomInfiniteQuery` with `axiosFetcher` in `queryFn` (see `components/reusable/Autocomplete.tsx`).

**After a client mutation** — prefer Server Actions + `router.refresh()` when possible; otherwise `useMutation` + `queryClient.invalidateQueries({ queryKey: [...] })`.

**User-triggered server calls** (export, download) → [fld-client-triggered-mutations](../fld-client-triggered-mutations/SKILL.md), not bare `onClick` fetch.

## Query keys

- Stable, hierarchical keys: `['users', companyId, filters]`.
- Include search/filter params in the key when they change the response.

## Checklist

- [ ] Server-first path ruled out.
- [ ] No `useEffect` solely to fetch on mount.
- [ ] `queryFn` uses `axiosFetcher`, not `fetch`.
- [ ] Loading/error from React Query (`isLoading`, `isError`, `error`), not ad-hoc `useState`.

## Related

- [fld-client-triggered-mutations](../fld-client-triggered-mutations/SKILL.md)
- [fld-server-first-data](../fld-server-first-data/SKILL.md)
- [fld-server-action-mutations](../fld-server-action-mutations/SKILL.md)
- `lib/axios_fetcher.ts`, `providers/ReactQueryProvider.tsx`
