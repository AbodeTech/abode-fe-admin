# Data Fetching Guidelines

This document outlines the standard patterns for data fetching in the Abode Admin application.

## Overview

- **Rendering**: Client-Side Rendering (CSR) with `"use client"`
- **Data Fetching**: React Query + Axios
- **Type Safety**: GraphQL Codegen (auto-generated types)
- **State**: React Query handles server state, Zustand for client state

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Component                                                  │
│  const { data, isLoading, error } = useAdminDashboard()    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Hook (hooks/use-*.ts)                                      │
│  useQuery + execute(TYPED_QUERY, variables)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  GraphQL Client (lib/graphql-client.ts)                     │
│  execute() → axios.post() with typed document               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Axios Client (lib/axios-client.ts)                         │
│  Interceptors: auth token injection, 401 handling           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
                 GraphQL API
```

---

## Type Generation with Codegen

Types are **auto-generated** from the GraphQL schema. Never manually define response types.

### How it works

1. Define a query using `graphql()` from `@/lib/gql`
2. Run `npm run codegen` (or it runs automatically with `npm run dev`)
3. Types are generated in `lib/gql/`
4. The `execute()` function infers types from the query

### Example

```typescript
import { graphql } from '@/lib/gql';

// Codegen reads this and generates types automatically
const GET_USER_QUERY = graphql(`
  query GetUser($id: ID!) {
    getUser(id: $id) {
      _id
      firstName
      lastName
      email
    }
  }
`);

// Types are inferred - no manual typing needed
const response = await execute(GET_USER_QUERY, { id: "123" });
// response.getUser is fully typed: { _id, firstName, lastName, email }
```

### Commands

```bash
npm run codegen        # Generate types once
npm run codegen:watch  # Watch mode (runs with dev server)
```

---

## Standard Pattern: Query Hook

All data fetching should use this pattern:

### 1. Create the hook file

```typescript
// hooks/use-users.ts
import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

// Define query - types auto-generated
const GET_USERS_QUERY = graphql(`
  query GetUsers($page: Int!, $limit: Int!) {
    getUsers(page: $page, limit: $limit) {
      count
      data {
        _id
        firstName
        lastName
        email
      }
    }
  }
`);

// Define params interface
interface UseUsersParams {
  page?: number;
  limit?: number;
}

// Export the hook
export const useUsers = (params?: UseUsersParams) => {
  const { page = 1, limit = 10 } = params ?? {};

  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => execute(GET_USERS_QUERY, { page, limit }),
    select: (data) => data.getUsers,
  });
};

// Export type for consumers (derived from hook return)
export type UsersData = NonNullable<ReturnType<typeof useUsers>['data']>;
```

### 2. Use in component

```typescript
// app/(dashboard)/users/page.tsx
"use client";

import { useUsers } from '@/hooks/use-users';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  const { data, isLoading, error } = useUsers({ page: 1, limit: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading users</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Users ({data?.count})</h1>
      {data?.data.map(user => (
        <div key={user._id}>{user.firstName} {user.lastName}</div>
      ))}
    </div>
  );
}
```

---

## Standard Pattern: Mutation Hook

For create, update, delete operations:

```typescript
// hooks/use-create-user.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

const CREATE_USER_MUTATION = graphql(`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      _id
      firstName
      lastName
    }
  }
`);

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      execute(CREATE_USER_MUTATION, { input }),
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

### Usage

```typescript
const { mutate, isPending } = useCreateUser();

const handleSubmit = (data: FormData) => {
  mutate(data, {
    onSuccess: () => toast.success('User created'),
    onError: (err) => toast.error(err.message),
  });
};
```

---

## File Structure

```
hooks/
├── use-admin-dashboard.ts    # Dashboard data
├── use-assets.ts             # Asset queries
├── use-create-asset.ts       # Asset mutations
├── use-users.ts              # User queries
├── use-transactions.ts       # Transaction queries
└── ...

lib/
├── axios-client.ts           # Axios instance + interceptors
├── graphql-client.ts         # execute() function
└── gql/                      # Auto-generated types (don't edit)
    ├── fragment-masking.ts
    ├── gql.ts
    ├── graphql.ts
    └── index.ts
```

---

## Rules

| Do | Don't |
|----|-------|
| Use `graphql()` for all queries | Use raw string queries |
| Use `execute()` for GraphQL calls | Use `fetch()` directly |
| Create hooks in `hooks/` folder | Fetch data in components |
| Use `useQuery` for reads | Use `useEffect` + `useState` |
| Use `useMutation` for writes | Call mutations directly |
| Let codegen generate types | Manually define response types |
| Use `select` to transform data | Transform in components |
| Handle loading/error states | Ignore error states |

---

## Query Key Conventions

```typescript
// List queries: [entity, ...filters]
queryKey: ['users', page, limit, search]
queryKey: ['assets', 'flex', page]
queryKey: ['transactions', status, startDate, endDate]

// Single item queries: [entity, id]
queryKey: ['user', userId]
queryKey: ['asset', assetId]

// Related data: [entity, id, relation]
queryKey: ['asset', assetId, 'subscribers']
queryKey: ['user', userId, 'transactions']
```

---

## Migration from SSR

When converting SSR pages to CSR:

1. Add `"use client"` at top of page
2. Remove `async` from component function
3. Replace direct API calls with hooks
4. Add loading and error UI

**Before (SSR):**
```typescript
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

**After (CSR):**
```typescript
"use client";

export default function Page() {
  const { data, isLoading, error } = useData();

  if (isLoading) return <Loader />;
  if (error) return <Error message={error.message} />;

  return <Component data={data} />;
}
```
