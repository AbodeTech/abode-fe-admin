# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Abode Admin — a Next.js 16 admin dashboard for managing real estate assets, users, transactions, agencies, and campaigns. Fully client-side rendered (CSR) with GraphQL API.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run codegen      # Generate GraphQL types (lib/gql/ — never edit manually)
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
lib/graphql-client.ts  # execute() — type-safe GraphQL via Axios
lib/axios-client.ts    # Axios instance with auth interceptors
lib/gql/               # Auto-generated codegen output (NEVER EDIT)
store/                 # Zustand stores (auth, UI state only)
actions/               # Next.js Server Actions
guidelines/            # Internal architecture documentation
```

## Data Fetching Pattern

All client data fetching follows: **Component → Feature Hook → `execute()` → Axios → GraphQL API**

- Queries use `graphql()` tag from `@/lib/gql` for codegen type generation
- GraphQL queries are defined inside hook files, not separate files
- `execute(TypedDocument, variables)` in `lib/graphql-client.ts` for type-safe calls
- React Query (`useQuery`/`useMutation`) for all server state
- Zustand only for client state (auth session, UI). Never for server state.
- Each feature has `query-keys.ts` with a factory pattern for cache keys
- Mutations invalidate queries via `queryClient.invalidateQueries()`

## Fragment Colocation Pattern

Components define their own GraphQL fragments for data requirements:
- Fragment naming: `ComponentName_propName` (e.g., `UserCard_user`)
- Props use `FragmentType<typeof Fragment>` — never manually type data props
- Unwrap with `useFragment(Fragment, props.data)` inside the component
- Parent queries spread child fragments: `...UserCard_user`

## Key Conventions

- **Features are self-contained** — no cross-feature imports (type-only imports allowed as escape hatch)
- **Pages stay thin** — only import hooks + feature components, handle loading/error
- **Don't create `types.ts`** in features — codegen generates types automatically
- **Don't create `services/`** — hooks call `execute()` directly
- **Components**: PascalCase (`AssetTable.tsx`). **Hooks**: kebab-case with `use-` prefix (`use-assets.ts`). **Schemas**: `.schema.ts` suffix
- Import order: React/Next → third-party → lib → features → components → types
- Forms: `react-hook-form` + `zod` + shadcn Form components
- URL search params for pagination/filters (`page`, `start_date`, `end_date`)
- `cn()` from `lib/utils.ts` for conditional Tailwind classes

## Auth

- Cookie-based JWT: `adminAccessToken`, `accessToken`, `user`, `adminRole`
- Middleware (`middleware.ts`) guards `/` and `/admin/*`, redirects to `/signin`
- Axios interceptor auto-attaches token and handles 401 → redirect to signin
- `lib/api/admin/` contains legacy API clients being migrated out

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` — GraphQL API endpoint
- `NEXT_PUBLIC_CLOUDINARY_PRESET` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — image uploads

## Stack

Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (new-york), React Query v5, Zustand v5, GraphQL Codegen, Axios, Zod, Sentry
