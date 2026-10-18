# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Abode Admin — a Next.js 16 admin dashboard for managing real estate assets, users, transactions, agencies, and campaigns. Fully client-side rendered (CSR) against a **REST API** (`abode-be-v2`, NestJS, base path `/api/v1`).

> **Migration in progress: GraphQL → REST + Zod** on branch `admin-graphql-decoupling`.
> New code follows the REST patterns below. Code still using `graphql()` /
> `execute()` / `useFragment` is pre-migration and should be converted, not
> extended. See `guidelines/Data_Fetching_Guidelines.md` and
> `docs/REST-ENDPOINT-MAP.md`.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
```

## Architecture

**Feature-based architecture** — domain logic lives in `features/`, pages in `app/` are thin shells.

```
app/(auth)/          # Auth pages: signin, forgot-password, reset-password
app/(dashboard)/     # Dashboard pages — import from features/, handle loading/error
features/<domain>/   # Self-contained feature modules (components/, hooks/, schemas/)
components/ui/       # shadcn/ui primitives (generated, don't modify)
components/shared/   # Cross-feature reusable components
components/layout/   # Sidebar, Header, Container
lib/api-client.ts    # Axios instance + envelope + apiGet/apiPost/apiGetPaged
lib/mocks/           # Mock transport keyed by "METHOD /path" (NEXT_PUBLIC_USE_MOCKS=true)
store/               # Zustand stores (auth, UI state only)
actions/             # Next.js Server Actions (writes only)
guidelines/          # Internal architecture documentation
```

## Data Fetching Pattern

All client data fetching follows: **Component → Feature Hook → `apiGet`/`apiPost` → Axios → REST API**

- Hooks call the helpers in `lib/api-client.ts`; never `axios`/`fetch` directly
- **Response types come from Zod schemas** in `features/*/schemas/`, derived with `z.infer`
- The BE envelope `{ success, data, message, meta }` is modeled once in `lib/api-client.ts` and unwrapped by the helpers — it never reaches hooks or components
- Failures throw `ApiClientError` (`statusCode`, `code`, `path`, `messages[]`)
- React Query (`useQuery`/`useMutation`) for all server state
- Zustand only for client state (auth session, UI). Never for server state.
- Each feature has `query-keys.ts` with a factory pattern for cache keys
- Mutations invalidate queries via `queryClient.invalidateQueries()`; toasts at the call-site, not inside the hook
- Query params go via the config `params` object; pagination is `?page=&limit=`
- The BE sets `forbidNonWhitelisted` — **an unknown body field is a hard 400**, so send exactly the DTO's fields

## Component Data Pattern

Components declare a **type contract**, not a fetch shape:
- Contract type is `Pick<Entity, 'field' | 'field'>` from the feature's Zod-derived entity type
- Never hand-write a data-prop interface — it drifts silently from the schema
- `FragmentType` / `useFragment` are GraphQL-only and are being removed. Don't reintroduce them.

## Key Conventions

- **Features are self-contained** — no cross-feature imports (type-only imports allowed as escape hatch)
- **Pages stay thin** — only import hooks + feature components, handle loading/error
- **Components call hooks, never API clients** — `lib/api/admin/*.client.ts` is a legacy layer imported directly by ~35 components; move those calls into hooks
- **Don't create `types.ts`** for response shapes — derive them from Zod schemas with `z.infer`
- **Don't create `services/`** — hooks call `apiGet`/`apiPost` directly
- **Components**: PascalCase (`AssetTable.tsx`). **Hooks**: kebab-case with `use-` prefix (`use-assets.ts`). **Schemas**: `.schema.ts` suffix
- Import order: React/Next → third-party → lib → features (schemas, then hooks) → components → types
- Forms: `react-hook-form` + `zod` + shadcn Form components
- URL search params for pagination/filters (`page`, `start_date`, `end_date`)
- `cn()` from `lib/utils.ts` for conditional Tailwind classes
- Zod is **v4** — prefer `z.looseObject({})` over `.passthrough()`, `z.url()` over `z.string().url()`

## Auth

- Cookie-based JWT: `adminAccessToken`, `user`, `adminRole` (plus a legacy `accessToken` read only by `lib/api/server-utils.ts` — an inconsistency to remove)
- Admin endpoints: `POST /auth/admin/login`, `GET /auth/admin/me`, `POST /auth/admin/change-password`
- The BE issues short-lived access tokens plus a rotating refresh token; **the FE has no refresh flow yet** — resolve before pointing auth at the real backend
- Axios interceptor attaches the token and handles 401 → redirect to signin
- **Known gaps** (not migration work, but worth knowing): `middleware.ts` matches `/`, `/admin/:path*`, `/signin`, but no `/admin/*` route group exists — the dashboard lives at `/(dashboard)/*`, so those routes are unguarded server-side. And the BE's 40-permission RBAC has **no FE enforcement** — permissions are stored at login but never checked.

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` — REST API base, including `/api/v1` (e.g. `http://localhost:7766/api/v1`)
- `NEXT_PUBLIC_USE_MOCKS` — `true` runs the app entirely off `lib/mocks/`, no backend needed
- `NEXT_PUBLIC_CLOUDINARY_PRESET` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — image uploads

## Stack

Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (new-york), React Query v5, Zustand v5, Axios, Zod v4, Sentry
