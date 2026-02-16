# Component Data Guidelines

This document outlines the standard for defining data requirements in UI components. We follow the **Fragment Colocation** pattern to ensure type safety, data isolation, and scalability.

## Core Principle: Colocation

Every component that requires data should define its own GraphQL fragment. This fragment declares exactly what fields the component needs. The parent component (or page) is responsible for fetching this data but does not need to know the specific fields required by the child.

## The Pattern

We use the generated `graphql` utility and specific types from our codegen setup.

### 1. Define the Fragment

Inside your component file, define the fragment using the `graphql` tag. Name the fragment using the convention `ComponentName_propName`.

```typescript
import { graphql } from '@/lib/gql'; // or relative path to generated/gql

const UserCardFragment = graphql(`
  fragment UserCard_user on User {
    id
    name
    email
    avatar_url
  }
`);
```

### 2. Define Props using `FragmentType`

Do not manually define interfaces for data props. Instead, use `FragmentType<typeof FragmentName>` to create an opaque type.

> [!TIP]
> **Finding Role Types**: If `codegen` fails with "Unknown type", check `lib/gql/graphql.ts` to find the correct type name from the schema (e.g. `UserReferralAdmin` instead of `AssociateUser`).

```typescript
import { FragmentType } from '@/lib/gql';

interface UserCardProps {
  // The 'user' prop expects data matching the UserCardFragment
  user: FragmentType<typeof UserCardFragment>;
  
  // Other UI props
  variant?: 'small' | 'large';
}
```

### 3. Unwrap Data with `useFragment`

Inside the component, use `useFragment` to unwrap the opaque type into a usable TypeScript object.

```typescript
import { useFragment } from '@/lib/gql';

export const UserCard = (props: UserCardProps) => {
  const user = useFragment(UserCardFragment, props.user);

  return (
    <div className="user-card">
      <img src={user.avatar_url} alt={user.name} />
      <p>{user.email}</p>
    </div>
  );
};
```

### 4. Composing Fragments (Parent Components)

When a parent component uses a child component, it should include the child's fragment in its own query or fragment.

```typescript
import { graphql } from '@/lib/gql';
import { UserCard } from './UserCard';

// The page query includes the UserCard fragment
const ALL_USERS_QUERY = graphql(`
  query AllUsers {
    users {
      id
      ...UserCard_user
    }
  }
`);

export default function UsersPage() {
  const { data } = useQuery({ queryKey: ['users'], queryFn: () => execute(ALL_USERS_QUERY) });
  
  return (
    <div>
      {data?.users.map(user => (
        // We pass the user object directly. TypeScript knows it satisfies the fragment requirements.
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Anti-Patterns to Avoid

- ❌ **Do not use `any`**: Never cast props to `any`.
- ❌ **Do not manually type data props**: Avoid `interface Props { user: { name: string, email: string } }`. This drifts out of sync with the API.
- ❌ **Do not over-fetch**: Don't select a generic "God Object" with all fields and pass it down. Only fetch what is defined in the fragments.
