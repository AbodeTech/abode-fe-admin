# Data Fetching Guidelines

This document outlines the standard patterns for data fetching in the Abode Admin application.

> **Migration note.** The backend has moved from GraphQL to a REST API
> (`abode-be-v2`, NestJS, base path `/api/v1`). This document replaces the
> previous GraphQL/Codegen version. The transport and the type source changed;
> the React Query patterns, query-key conventions, and hook structure did not.

## Overview

- **Rendering**: Client-Side Rendering (CSR) with `"use client"`
- **Data Fetching**: React Query + Axios
- **Type Safety**: **Zod schemas at the boundary** (schema is the source of truth; the type is derived with `z.infer`)
- **State**: React Query handles server state, Zustand for client state

Why Zod instead of generated types: the backend has no trustworthy type source
today (responses include raw Mongoose documents, `any` fields, and an
undocumented response envelope). Compile-time-only types would trust a server
that can drift silently. Zod validates the shape **at runtime**, at the edge, so
a drift surfaces as a clear, located error instead of `undefined is not an
object` three layers into a component.

> Zod here is **v4**. Prefer `z.looseObject({...})` over the deprecated
> `z.object({...}).passthrough()`, and top-level `z.url()` over
> `z.string().url()`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Component                                                  │
│  const { data, isLoading, error } = useUsers()              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Hook (features/*/hooks/use-*.ts)                           │
│  useQuery + apiGet('/admin/users', UserSchema)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  API helpers (lib/api-client.ts)                            │
│  apiGet/apiPost → axios call → unwrap envelope → Zod parse  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Axios instance (lib/api-client.ts)                         │
│  Interceptors: auth token injection, 401 handling           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
                   REST API
```

---

## The response envelope

**Every** backend response is wrapped by a global interceptor in this shape:

```jsonc
// Success
{ "success": true, "message": "...", "data": { /* payload */ }, "meta": { /* optional */ } }

// Paginated — rows in `data`, pagination in `meta`
{ "success": true, "data": [ /* rows */ ],
  "meta": { "total": 128, "page": 1, "limit": 20, "totalPages": 7 } }

// Error
{ "success": false, "statusCode": 400, "error": "Bad Request", "code": "SOME_CODE",
  "message": "One message — OR an array of messages", "path": "/api/v1/..." }
```

Model this envelope **once**, in `lib/api-client.ts`. Never re-declare it per
endpoint, and never let the raw envelope leak into hooks or components — the
API helpers unwrap `.data` for you and hand back only the inner payload.

```typescript
// lib/api-client.ts
import axios from 'axios';
import { z } from 'zod';

export const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL });
// ... auth token injection + 401 handling interceptors ...

// The envelope, modeled exactly once.
const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data,
    meta: z
      .object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() })
      .partial()
      .optional(),
  });

// Returns the parsed inner payload (envelope stripped).
export async function apiGet<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  config?: { params?: Record<string, unknown> },
): Promise<z.infer<T>> {
  const res = await apiClient.get(url, config);
  return envelope(schema).parse(res.data).data;
}

export async function apiPost<T extends z.ZodTypeAny>(
  url: string,
  body: unknown,
  schema: T,
): Promise<z.infer<T>> {
  const res = await apiClient.post(url, body);
  return envelope(schema).parse(res.data).data;
}
// apiPatch / apiPut / apiDelete follow the same shape.
// apiGetPaged returns { items, meta } for list endpoints.
```

### Request rules

- The BE runs `ValidationPipe` with **`forbidNonWhitelisted: true`** — sending
  **any** field the endpoint's DTO doesn't declare is a hard 400. Never spread
  a whole form state into a request body; send exactly the DTO fields.
- Query params go through the config `params` object, not hand-built strings.
- Pagination is offset-based everywhere: `?page=` (default 1), `?limit=` (default 20).

---

## Response types with Zod

Types are **derived from Zod schemas** — the schema is the single source of
truth. Never hand-write a separate interface for a response shape; it will drift
from the schema.

### How it works

1. Define an entity/response schema in the feature's `schemas/` folder.
2. Derive the TypeScript type with `z.infer`.
3. Pass the schema to `apiGet`/`apiPost`; the return value is fully typed.

### Example

```typescript
// features/users/schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  _id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  referral_status: z.string().nullable().optional(),
});

// The type is derived — do not hand-write it.
export type User = z.infer<typeof UserSchema>;
```

### Validate where it matters — not religiously

Wrapping the envelope is free (it's in `lib/`), but writing a full schema for
every trivial response is not worth it on day one. Concentrate schemas where a
silent shape change would actually hurt: **money, transactions, commission,
wallets, anything financial or auth-related.** For low-stakes responses a
looser schema (e.g. `z.looseObject({})`) is acceptable as a stopgap — just
don't leave those on the paths that matter.

A Zod parse failure throws, so React Query surfaces it through `error` just like
a network or 4xx error — the existing error UI catches schema drift for free.

---

## Standard Pattern: Query Hook

```typescript
// features/users/hooks/use-users.ts
import { useQuery } from '@tanstack/react-query';
import { apiGetPaged } from '@/lib/api-client';
import { UserSchema } from '../schemas/user.schema';
import { userKeys } from './query-keys';

export const useUsers = (params?: { page?: number; limit?: number; search?: string }) => {
  const { page = 1, limit = 20, search } = params ?? {};
  return useQuery({
    queryKey: userKeys.list({ page, limit, search }),
    queryFn: () => apiGetPaged('/admin/users', UserSchema, { params: { page, limit, search } }),
  });
};
```

**Rules:**
- `queryKey` comes from the feature's `query-keys.ts` factory — never inline strings.
- Use `select` only to pick a subpath — not to reshape objects. When the UI
  needs a view-model, use a **named mapper** applied after the parse inside
  `queryFn`, so the cache holds one final shape.
- For params-gated queries, set `enabled: !!param`.

### 2. Use in component

```typescript
// app/(dashboard)/users/page.tsx
"use client";

import { useUsers } from '@/features/users';

export default function UsersPage() {
  const { data, isLoading, error } = useUsers();

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error.message} />;

  return <UsersTable rows={data?.items ?? []} />;
}
```

---

## Standard Pattern: Mutation Hook

```typescript
// features/users/hooks/use-suspend-user.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiPatch } from '@/lib/api-client';
import { userKeys } from './query-keys';

const SuspendResponseSchema = z.object({ message: z.string().nullable().optional() });

export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPatch(`/admin/users/${userId}/suspend`, {}, SuspendResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
```

Mutations stay **silent about UI** — the call-site decides whether to toast, so
one mutation can serve a modal (toast) and a background flow (quiet).

---

## Errors

`ApiClientError` (thrown by the helpers) replaces the GraphQL error path:

```typescript
export class ApiClientError extends Error {
  statusCode?: number;   // HTTP status
  code?: string;         // machine-readable BE code
  path?: string;         // request path
  method?: string;
  messages: string[];    // BE `message` normalized — string OR string[]
}
```

The BE returns real 401s, so auth detection is a plain status check — the old
GraphQL-error sniffing in the axios interceptor (`extensions.code ===
'UNAUTHENTICATED'`, message contains "unauthorized") is gone. Prefer the BE's
`code` field over message matching when handling a specific failure.

---

## Rules

| Do | Don't |
|----|-------|
| Use `apiGet`/`apiPost` helpers from `lib/api-client.ts` | Call `axios`/`fetch` directly in hooks |
| Model the response envelope once in `lib/` | Re-declare `{ success, data, ... }` per endpoint |
| Define Zod schemas in the feature's `schemas/` | Hand-write response interfaces |
| Derive types with `z.infer` | Maintain a separate `types.ts` for responses |
| Create hooks in `features/*/hooks/` | Fetch data in components |
| Call hooks from components | Import an API client into a component |
| Use `useQuery` for reads, `useMutation` for writes | `useEffect` + `useState` fetching |
| Validate the endpoints that matter (money, auth) | Ship unvalidated data on critical paths |
| Use `select` to pick a subpath | Use `select` to reshape objects |
| Send exactly the DTO's fields | Spread extra keys into a body (`forbidNonWhitelisted` → 400) |
| Handle loading/error states | Ignore error states |

---

## Query Key Conventions

Unchanged — React Query keys are transport-agnostic.

```typescript
// List queries: [entity, ...filters]
queryKey: ['users', { page, limit, search }]
queryKey: ['assets', 'flex', { page }]

// Single item queries: [entity, id]
queryKey: ['user', userId]
queryKey: ['asset', assetId]

// Related data: [entity, id, relation]
queryKey: ['asset', assetId, 'subscribers']
```

See each feature's `hooks/query-keys.ts` factory.

---

## Legacy layers being removed

Three pre-migration patterns are **deprecated**. Don't add to them:

1. **`lib/api/admin/*.client.ts`** — a parallel client layer imported directly
   by ~35 components, bypassing hooks entirely. Its calls belong in feature
   hooks; its hand-written `*.types.ts` shapes belong in Zod schemas.
2. **Raw-string GraphQL** (`executeRaw` / `fetchGraphql`) — untyped, so it had
   no codegen safety net. Every one becomes a typed `apiGet`/`apiPost` call.
3. **`fetchServerGraphql` + server actions for reads** — server-side fetching
   in `lib/api/server-utils.ts` reads a different cookie (`accessToken`) than
   the rest of the app (`adminAccessToken`). Reads move to CSR hooks; only
   genuine write-then-revalidate actions stay server-side.

---

## Mock mode

`lib/mocks/` lets the app run with no backend (`NEXT_PUBLIC_USE_MOCKS=true`).
Dispatch is by **`METHOD /path`**, matching the REST client. Handlers return
the **inner payload only** (what the BE puts in `envelope.data`); paginated
handlers return `{ data, meta }`.

### The one bug class Zod and tsc won't catch

A mapper that still reads a **pre-migration shape** survives both: Zod
validates the payload fine, and TypeScript accepts it when the mapper's
parameter type has all-optional fields (a flat object is structurally
assignable to a type expecting an optional nested key). The result is a
silently empty list, not an error.

When converting a hook, re-read its mapper against the **new** shape, and type
mappers with the schema's `z.infer` rather than a hand-written `Raw*` type — so
a stale read path becomes a compile error instead of an empty table.

---

## Later: OpenAPI codegen (not yet)

The backend has `@nestjs/swagger` and serves a spec at `/api/docs-json` in
non-production, **but that spec currently contains no response schemas** —
codegen against it today would produce `unknown` for every response body. Do
not build on it yet.

When the backend adds response DTOs, the plan is to point `openapi-typescript`
(or `orval`) at the spec and migrate endpoints **individually** from
hand-written Zod to generated types. Zod stays the floor; codegen replaces it
endpoint-by-endpoint only once the backend earns the trust.
