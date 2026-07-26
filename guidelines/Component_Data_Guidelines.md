# Component Data Guidelines

This document outlines the standard for defining data requirements in UI components.

> **Migration note.** This replaces the previous **Fragment Colocation** version.
> Fragment colocation (`graphql` fragments, `FragmentType`, `useFragment`) was a
> GraphQL-only feature — it relied on a child component's field requests being
> merged into the parent's single GraphQL request. REST has no equivalent: an
> endpoint returns a fixed, server-defined shape, and a component cannot inject
> its field needs into the parent's fetch. **`useFragment` and `FragmentType` no
> longer exist in this codebase. Do not reintroduce them.**
>
> The *intent* of the old pattern survives — components owning their data
> requirements, no type drift, no God objects. The mechanism is now the
> **component data contract**: a component declares the *type* it consumes, not
> the *fetch shape*.

## Core Principle: Contracts, not fetches

A component that renders data should declare the exact shape it needs as a
**type contract**, derived from a Zod schema. The parent is responsible for
fetching (via a hook) and passes down data that satisfies the contract. The
parent does not need to hand-craft the child's shape; the child owns its own
contract and the type-checker enforces the fit.

The honest difference from GraphQL: the child declares the **type** it needs,
not the **fields fetched over the wire**. REST returns what the endpoint
returns — a component can't shrink the payload. Contracts protect you from type
drift and God-object passing; they do not reduce network payload (see
"Over-fetching" below).

## The Pattern

Schemas are the source of truth. Types are derived with `z.infer` and live
alongside the schema in the feature's `schemas/` folder.

### 1. Define the entity schema (once per feature)

```typescript
// features/users/schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  _id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  profile_pic: z.string().nullable().optional(),
  referral_status: z.string().nullable().optional(),
  // ...other fields the API returns
});

export type User = z.infer<typeof UserSchema>;
```

### 2. Define the component's contract with `Pick`

A component should accept the **smallest** slice of the entity it actually
renders. Use `Pick` (or a component-local schema) so the prop type says exactly
what the component depends on — not the whole entity.

```typescript
// features/users/components/UserCard.tsx
import type { User } from '../schemas/user.schema';

// The contract: UserCard only needs these three fields.
type UserCardData = Pick<User, 'firstName' | 'email' | 'profile_pic'>;

interface UserCardProps {
  user: UserCardData;
  variant?: 'small' | 'large';
}

export const UserCard = ({ user, variant = 'small' }: UserCardProps) => {
  return (
    <div className="user-card">
      {user.profile_pic && <img src={user.profile_pic} alt={user.firstName ?? ''} />}
      <p>{user.email}</p>
    </div>
  );
};
```

> **Prefer `Pick` over a fresh interface.** `Pick<User, ...>` stays tied to the
> schema — if a field is renamed or removed in `UserSchema`, every contract that
> `Pick`s it fails to compile, and you find out immediately. A hand-written
> `interface { firstName: string; email: string }` drifts silently. That drift is
> the exact failure the old fragment doc existed to prevent; `Pick` preserves the
> guarantee without GraphQL.

For a component with a larger or reused contract, define a local schema instead
of a `Pick` and export its type:

```typescript
// component-owned contract as a schema
const UserCardData = UserSchema.pick({ firstName: true, email: true, profile_pic: true });
type UserCardData = z.infer<typeof UserCardData>;
```

**Note on nesting.** `Pick` only narrows at the top level. A component that
reads `row.asset.name` takes the whole `asset` sub-document — there is no REST
equivalent of a fragment's per-subfield selection. That's a real difference from
the old pattern, and it's fine: the drift protection is what mattered.

### 3. Parent fetches, then passes data down

The parent uses the feature hook (which validates the full response against
`UserSchema` at the boundary — see Data Fetching Guidelines) and passes each
user straight to the child. TypeScript checks that the full `User` satisfies the
child's narrower contract.

```typescript
// features/users/components/UsersList.tsx
import { useUsers } from '../hooks/use-users';
import { UserCard } from './UserCard';

export const UsersList = () => {
  const { data } = useUsers();

  return (
    <div>
      {data?.items.map((user) => (
        // A full `User` satisfies `Pick<User, ...>` — no mapping needed.
        <UserCard key={user._id} user={user} />
      ))}
    </div>
  );
};
```

No `useFragment` unwrap step. The data arrives already validated and typed at
the boundary; children just consume it.

## Anti-Patterns to Avoid

- ❌ **Don't use `any`.** Never cast props to `any` to sidestep a type mismatch.
- ❌ **Don't hand-write data-prop interfaces.** Avoid
  `interface Props { user: { firstName: string; email: string } }`. Derive from
  the schema with `Pick` or `z.infer` so it can't drift from the validated shape.
- ❌ **Don't pass God objects.** Don't accept the whole entity "just in case."
  Declare the narrow contract the component actually renders. This keeps
  components decoupled from fields they don't use, so a schema change only
  touches the components that truly depend on the changed field.
- ❌ **Don't reintroduce fragments.** `graphql` fragments, `FragmentType`, and
  `useFragment` are gone. If you see them in old code, that code is
  pre-migration and should be converted.
- ❌ **Don't import an API client into a component.** Components call hooks;
  hooks call `apiGet`/`apiPost`. The `lib/api/admin/*.client.ts` layer that ~35
  components import directly is legacy and is being removed.

## A note on over-fetching

The old doc listed "don't over-fetch" as an anti-pattern, because GraphQL let a
component control exactly which fields were requested. **REST does not give you
that.** An endpoint returns its full server-defined payload; a narrow component
contract does not shrink what comes over the wire.

So the realistic guidance is:

- Component contracts control **coupling and type drift**, not payload size.
- Reducing payload size is a **backend concern** — it requires sparse-fieldset
  support (e.g. `?fields=name,email`) or a BFF/aggregation layer. If neither
  exists, over-fetching at the network level is simply a property of the API,
  not something a component can fix.
- Don't write frontend code that pretends to control payload size (e.g. fake
  "field selection" props). Declare the type contract; leave payload shaping to
  the API if and when it supports it.
