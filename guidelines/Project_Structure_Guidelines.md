# Project Structure Guidelines

This document outlines the folder structure for the Abode Admin application.

## Overview

We use a **feature-based architecture** where related code is colocated by domain rather than by technical type.

---

## Folder Structure

```
abode-admin-fe/
│
├── app/                          # Next.js App Router (pages only)
│   ├── (auth)/                   # Auth pages
│   ├── (dashboard)/              # Dashboard pages
│   └── layout.tsx
│
├── features/                     # Feature modules (domain-driven)
│   ├── assets/
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   └── users/
│
├── components/                   # Shared components only
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Sidebar, Header, etc.
│   └── shared/                   # Pagination, filters, etc.
│
├── lib/                          # Core utilities
│   ├── gql/                      # Codegen output (auto-generated)
│   ├── axios-client.ts           # Axios instance + interceptors
│   ├── graphql-client.ts         # execute() function
│   └── utils.ts                  # General utilities (cn, etc.)
│
├── store/                        # Zustand stores (global state)
│   ├── auth-store.ts
│   └── ui-store.ts
│
├── guidelines/                   # Documentation
│
├── middleware.ts                 # Auth middleware
└── codegen.ts                    # GraphQL codegen config
```

---

## Feature Module Structure

Each feature follows this structure:

```
features/
└── assets/
    ├── components/               # Feature-specific components
    │   ├── AssetTable.tsx
    │   ├── AssetForm.tsx
    │   ├── AssetDetailHeader.tsx
    │   └── ...
    │
    ├── hooks/                    # React Query hooks
    │   ├── query-keys.ts         # Query key factory
    │   ├── use-assets.ts         # Queries: useAssets, useAsset
    │   ├── use-create-asset.ts   # Mutations: useCreateFlexAsset
    │   ├── use-update-asset.ts   # Mutations: useUpdateAsset
    │   └── use-asset-subscribers.ts
    │
    ├── schemas/                  # Zod validation schemas
    │   └── asset.schema.ts
    │
    └── index.ts                  # Public exports (barrel file)
```

### Hook naming convention

| Type | Pattern | Example |
|------|---------|---------|
| Queries | `use-{resource}.ts` | `use-assets.ts`, `use-users.ts` |
| Mutations | `use-{action}-{resource}.ts` | `use-create-asset.ts`, `use-update-user.ts` |
| Query keys | `query-keys.ts` | One per feature |

### What goes where

| Folder | Contains | Example |
|--------|----------|---------|
| `components/` | UI components for this feature | `AssetTable.tsx`, `AssetForm.tsx` |
| `hooks/` | React Query hooks (queries + mutations) | `use-assets.ts`, `use-create-asset.ts` |
| `schemas/` | Zod schemas for form validation | `asset.schema.ts` |
| `index.ts` | Public exports | `export * from './hooks/use-assets'` |

### What NOT to include

| Don't add | Reason |
|-----------|--------|
| `types.ts` | Codegen generates types automatically |
| `services/` | Hooks call `execute()` directly |
| `utils/` | Put in `lib/utils/` if truly shared |
| `constants/` | Put in component or hook file |

---

## Rules

### 1. Features are self-contained

A feature should contain everything it needs. If you're working on assets, everything should be in `features/assets/`.

```typescript
// Good - import from same feature
import { AssetTable } from '../components/AssetTable';
import { useAssets } from '../hooks/use-assets';

// Bad - reaching into another feature
import { UserProfile } from '@/features/users/components/UserProfile';
```

### 2. Features don't import from each other

If two features need the same code, move it to `components/shared/` or `lib/`.

```
features/assets/  ←✗→  features/users/     # Never import between features
       ↓                      ↓
    components/shared/                      # Shared components go here
           lib/                             # Shared utilities go here
```

**Escape hatch:** Sometimes features legitimately need each other. If feature A needs something from feature B:

1. First ask: should this be in `shared/`?
2. If truly feature-specific, **import the TYPE only**, not the component
3. Or create a shared hook in `lib/` that composes both

```typescript
// ✓ OK - importing just a type
import type { User } from '@/features/users';

// ✗ Bad - importing component from another feature
import { UserAvatar } from '@/features/users';
```

### 3. Pages stay thin

Pages in `app/` should only:
- Import the feature hook
- Handle loading/error states
- Render feature components

```typescript
// app/(dashboard)/assets/page.tsx
"use client";

import { useAssets } from '@/features/assets';
import { AssetTable } from '@/features/assets';
import { Loader } from '@/components/shared/Loader';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export default function AssetsPage() {
  const { data, isLoading, error } = useAssets();

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error.message} />;

  return <AssetTable data={data} />;
}
```

**Error boundaries:** For production, consider adding an `error.tsx` file alongside pages to catch render errors:

```typescript
// app/(dashboard)/assets/error.tsx
"use client";

export default function AssetsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 4. Hooks contain queries

GraphQL queries live inside hooks, not in separate files.

```typescript
// features/assets/hooks/use-assets.ts
import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { assetKeys } from './query-keys';

// Query defined in the hook file
const GET_ASSETS_QUERY = graphql(`
  query GetAssets($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      count
      data {
        _id
        asset_name
        asset_type
      }
    }
  }
`);

export const useAssets = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => execute(GET_ASSETS_QUERY, {
      page: params?.page ?? 1,
      limit: params?.limit ?? 50
    }),
    select: (data) => data.getAllAdminAssets,
  });
};
```

### Query keys factory

Each feature should have a `query-keys.ts` file for consistent cache management:

```typescript
// features/assets/hooks/query-keys.ts
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters?: { page?: number; limit?: number }) =>
    [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  subscribers: (id: string) => [...assetKeys.detail(id), 'subscribers'] as const,
};
```

Usage in mutations for cache invalidation:

```typescript
// features/assets/hooks/use-create-asset.ts
import { assetKeys } from './query-keys';

export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => execute(CREATE_ASSET_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};
```

### 5. Intentional barrel exports

Each feature has an `index.ts` that exports its **public API only**.

**Don't export everything blindly.** Only export what other parts of the app actually need. Internal helpers, sub-components, and utilities stay private.

```typescript
// features/assets/index.ts

// ✓ Public hooks - used by pages
export { useAssets } from './hooks/use-assets';
export { useCreateFlexAsset } from './hooks/use-create-asset';

// ✓ Public components - used by pages
export { AssetTable } from './components/AssetTable';
export { AssetForm } from './components/AssetForm';

// ✗ DON'T export internal helpers
// export { formatAssetPrice } from './utils/format';      // Keep internal
// export { AssetTableRow } from './components/AssetTableRow';  // Sub-component, keep internal
// export { GET_ASSETS_QUERY } from './hooks/use-assets';  // Implementation detail
```

**Ask yourself:** Does code outside this feature need this? If no, don't export it.

```typescript
// Clean imports from feature root
import { useAssets, AssetTable } from '@/features/assets';
```

---

## Shared Components

### `components/ui/`

shadcn/ui primitives. Don't modify these directly - they're generated.

```
components/ui/
├── button.tsx
├── input.tsx
├── dialog.tsx
├── table.tsx
└── ...
```

### `components/layout/`

App-wide layout components.

```
components/layout/
├── Sidebar.tsx
├── Header.tsx
├── Container.tsx
├── MobileBottomTab.tsx
└── MobileTopBar.tsx
```

### `components/shared/`

Reusable components used across multiple features.

```
components/shared/
├── Loader.tsx           # Loading spinner
├── ErrorMessage.tsx     # Error display
├── Pagination.tsx       # Table pagination
├── DateFilter.tsx       # Date range picker
├── FilterSelect.tsx     # Multi-select filter
└── EmptyState.tsx       # Empty data placeholder
```

**Rule:** Only put something in `shared/` if it's used by 2+ features.

---

## Lib Folder

### `lib/gql/`

Auto-generated by codegen. **Never edit manually.**

### `lib/graphql-client.ts`

The `execute()` function for GraphQL calls.

```typescript
import { execute } from '@/lib/graphql-client';
```

### `lib/axios-client.ts`

Axios instance with auth interceptors.

### `lib/utils.ts`

General utilities like `cn()` for classnames.

### `lib/utils/`

Specific utility modules:

```
lib/utils/
├── cookies.ts           # Client-side cookie helpers
├── format.ts            # Date/number formatting
└── validation.ts        # Common validation helpers
```

---

## Store (Zustand)

Global client state only. Keep stores minimal.

```
store/
├── auth-store.ts        # User session, isAuthenticated
└── ui-store.ts          # Sidebar collapsed, theme, etc.
```

**Rule:** Don't use Zustand for server state - that's what React Query is for.

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AssetTable.tsx` |
| Hooks | kebab-case with `use-` prefix | `use-assets.ts` |
| Schemas | kebab-case with `.schema` suffix | `asset.schema.ts` |
| Utils | kebab-case | `format-date.ts` |
| Types | kebab-case with `.types` suffix | `asset.types.ts` (only if needed) |

---

## Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal - lib
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

// 4. Internal - features (same feature first)
import { useAssets } from '../hooks/use-assets';

// 5. Internal - components
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/shared/Loader';

// 6. Types (if separate)
import type { Asset } from './types';
```

---

## Scaling Large Features

When a feature's `components/` folder exceeds ~15 files, group by sub-domain.

### Before (flat, getting messy):

```
features/assets/
  components/
    AssetTable.tsx
    AssetTableRow.tsx
    AssetTableFilters.tsx
    AssetForm.tsx
    AssetFormFields.tsx
    AssetDetail.tsx
    AssetDetailHeader.tsx
    AssetDetailTabs.tsx
    AssetCard.tsx
    AssetStatusBadge.tsx
    ... (20+ files)
```

### After (grouped by sub-domain):

```
features/assets/
  components/
    table/
      AssetTable.tsx
      AssetTableRow.tsx
      AssetTableFilters.tsx
      index.ts              # exports AssetTable only

    form/
      AssetForm.tsx
      AssetFormFields.tsx
      AssetFormImages.tsx
      index.ts              # exports AssetForm only

    detail/
      AssetDetail.tsx
      AssetDetailHeader.tsx
      AssetDetailTabs.tsx
      index.ts              # exports AssetDetail only

    shared/
      AssetStatusBadge.tsx
      AssetTypeSelect.tsx
      AssetCard.tsx
      index.ts

  index.ts                  # feature barrel export
```

### Sub-folder barrel exports:

```typescript
// features/assets/components/table/index.ts
export { AssetTable } from './AssetTable';
// Don't export AssetTableRow — it's internal
```

```typescript
// features/assets/index.ts
export { AssetTable } from './components/table';
export { AssetForm } from './components/form';
export { AssetDetail } from './components/detail';
export { useAssets } from './hooks/use-assets';
```

### When to split:

| Condition | Action |
|-----------|--------|
| < 10 files | Keep flat |
| 10-15 files | Consider grouping |
| 15+ files | Definitely group |
| Can't find files quickly | Group |

### Naming sub-folders:

Name by what they represent, not by page:

```
# Good (domain-based)
table/
form/
detail/
shared/

# Bad (page-based)
list-page/
create-page/
edit-page/
```

---

## Migration Checklist

When migrating existing code to this structure:

- [ ] Create `features/` folder
- [ ] Move `components/features/*` → `features/*/components/`
- [ ] Create hooks in `features/*/hooks/` using the data fetching guidelines
- [ ] Move schemas to `features/*/schemas/`
- [ ] Create `index.ts` barrel exports
- [ ] Update imports in `app/` pages
- [ ] Delete old `lib/api/admin/` files after migration
- [ ] Update `codegen.ts` to scan `features/` folder
- [ ] Test all pages work correctly
