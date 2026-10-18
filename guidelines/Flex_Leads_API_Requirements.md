# Flex Leads API Requirements

This document describes what the admin frontend (`/flex-leads`) expects from the backend so brochure downloads and site-inspection bookings can be listed, filtered, counted, and updated.

Public forms live on **abode-v2** (Flex product landing). Admin does **not** create leads — it only reads and updates them after the public (or realtor) side persists submissions.

Admin `/flex-leads` calls `getFlexLeads`, `flexLeadCounts`, and `updateFlexLead` live.

---

## Domain model

Store one collection/table for both lead types.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `ID` / ObjectId | yes | Stable id returned to admin |
| `type` | enum | yes | `"brochure"` \| `"site_inspection"` |
| `fullName` | String | yes | From form `fullName` (≥ 2 chars) |
| `email` | String | yes | Valid email |
| `phone` | String | yes | E.164, Nigeria: `+234…` (local leading `0` stripped on submit) |
| `location` | String \| null | conditional | **Required** when `type === "site_inspection"`; `null` for brochure |
| `status` | enum | yes | Default `"new"` on create |
| `adminNotes` | String \| null | no | Internal follow-up notes; only admins write this |
| `createdAt` | Date | yes | Submission time |
| `updatedAt` | Date \| null | no | Last admin (or system) update |

### Status enum

```
new → contacted → scheduled → completed
                              ↘ closed
```

Allowed values (exact strings):

- `new`
- `contacted`
- `scheduled`
- `completed`
- `closed`

Do not invent synonyms (`pending`, `done`, etc.) — the admin UI maps these literally.

### Type enum

- `brochure` — brochure download registration (`fullName`, `email`, `phone`)
- `site_inspection` — site inspection booking (same + `location`)

---

## Auth

| Operation | Who | Auth |
|-----------|-----|------|
| Public create (brochure / site inspection) | Landing / realtor client | Unauthenticated (same pattern as `joinCommunityEmail`) |
| `getFlexLeads` | Admin | Admin JWT (existing admin GraphQL auth) |
| `flexLeadCounts` | Admin | Admin JWT |
| `updateFlexLead` | Admin | Admin JWT |

---

## GraphQL schema (suggested)

```graphql
enum FlexLeadType {
  brochure
  site_inspection
}

enum FlexLeadStatus {
  new
  contacted
  scheduled
  completed
  closed
}

type FlexLead {
  id: ID!
  type: FlexLeadType!
  fullName: String!
  email: String!
  phone: String!
  location: String
  status: FlexLeadStatus!
  adminNotes: String
  createdAt: Date!
  updatedAt: Date
}

input FlexLeadFilters {
  type: FlexLeadType
  status: FlexLeadStatus
  search: String
}

type FlexLeadListPayload {
  count: Int!
  data: [FlexLead!]!
}

type FlexLeadCounts {
  new: Int!
  contacted: Int!
  scheduled: Int!
  completed: Int!
  closed: Int!
}

input CreateBrochureLeadInput {
  fullName: String!
  email: String!
  phone: String!
}

input CreateSiteInspectionLeadInput {
  fullName: String!
  email: String!
  phone: String!
  location: String!
}

extend type Query {
  getFlexLeads(page: Int, limit: Int, filters: FlexLeadFilters): FlexLeadListPayload!
  flexLeadCounts: FlexLeadCounts!
}

extend type Mutation {
  # Public (unauthenticated) — wire from abode-v2 forms
  createBrochureLead(input: CreateBrochureLeadInput!): FlexLead!
  createSiteInspectionLead(input: CreateSiteInspectionLeadInput!): FlexLead!

  # Admin
  updateFlexLead(id: ID!, status: FlexLeadStatus, adminNotes: String): FlexLead!
}
```

Field names above are **camelCase** to match what admin already queries. If the DB uses snake_case, map in the resolver — do not change the GraphQL field names without updating admin.

---

## Admin queries (already called by FE)

### `getFlexLeads`

```graphql
query GetFlexLeads($page: Int, $limit: Int, $filters: FlexLeadFilters) {
  getFlexLeads(page: $page, limit: $limit, filters: $filters) {
    count
    data {
      id
      type
      fullName
      email
      phone
      location
      status
      adminNotes
      createdAt
      updatedAt
    }
  }
}
```

**Behaviour**

- `page` default `1`, `limit` default `10`
- Omit or null filter fields = no filter on that dimension
- `search`: case-insensitive match on `fullName`, `email`, `phone` (location optional)
- Sort: newest `createdAt` first
- `count`: total matching rows **before** pagination
- `data`: current page only

**Example variables**

```json
{
  "page": 1,
  "limit": 10,
  "filters": {
    "status": "new",
    "type": "site_inspection",
    "search": "chinedu"
  }
}
```

### `flexLeadCounts`

```graphql
query FlexLeadCounts {
  flexLeadCounts {
    new
    contacted
    scheduled
    completed
    closed
  }
}
```

**Behaviour**

- Counts across **all** leads (not scoped to current list filters), unless product later asks for type-scoped counts
- Every key must always be present (use `0` when empty)

---

## Admin mutation (already called by FE)

### `updateFlexLead`

```graphql
mutation UpdateFlexLead($id: ID!, $status: String, $adminNotes: String) {
  updateFlexLead(id: $id, status: $status, adminNotes: $adminNotes) {
    id
    status
    adminNotes
  }
}
```

**Behaviour**

- At least one of `status` / `adminNotes` should be updatable per call
- Set `updatedAt` on every successful update
- Return the updated lead (admin invalidates list + counts on success)
- Unknown `id` → GraphQL error with a clear message

---

## Public create mutations (for abode-v2 / realtor)

These are **not** implemented in admin, but payloads must match the Flex Zod schemas so admin rows stay 1:1 with submissions.

### Brochure

```json
{
  "fullName": "Adaobi Okonkwo",
  "email": "adaobi.okonkwo@gmail.com",
  "phone": "+2348012345678"
}
```

On create: `type = "brochure"`, `location = null`, `status = "new"`, `adminNotes = null`.

### Site inspection

```json
{
  "fullName": "Chinedu Eze",
  "email": "chinedu.eze@yahoo.com",
  "phone": "+2348098765432",
  "location": "Abode Flex Estate, Lekki"
}
```

On create: `type = "site_inspection"`, `status = "new"`, `adminNotes = null`.

Validate:

- `fullName` trimmed, min length 2
- `email` valid
- `phone` E.164 (client sends `+234` + local digits without leading `0`)
- `location` trimmed, min length 2 when type is site inspection

---

## Example list response

```json
{
  "data": {
    "getFlexLeads": {
      "count": 2,
      "data": [
        {
          "id": "665f1a2b3c4d5e6f7a8b9c0d",
          "type": "brochure",
          "fullName": "Adaobi Okonkwo",
          "email": "adaobi.okonkwo@gmail.com",
          "phone": "+2348012345678",
          "location": null,
          "status": "new",
          "adminNotes": null,
          "createdAt": "2026-08-11T08:15:00.000Z",
          "updatedAt": null
        },
        {
          "id": "665f1a2b3c4d5e6f7a8b9c0e",
          "type": "site_inspection",
          "fullName": "Chinedu Eze",
          "email": "chinedu.eze@yahoo.com",
          "phone": "+2348098765432",
          "location": "Abode Flex Estate, Lekki",
          "status": "new",
          "adminNotes": null,
          "createdAt": "2026-08-11T13:15:00.000Z",
          "updatedAt": null
        }
      ]
    }
  }
}
```

---

## Suggested Mongo model sketch

```ts
{
  type: { type: String, enum: ["brochure", "site_inspection"], required: true, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  phone: { type: String, required: true, trim: true, index: true },
  location: { type: String, default: null, trim: true },
  status: {
    type: String,
    enum: ["new", "contacted", "scheduled", "completed", "closed"],
    default: "new",
    index: true,
  },
  adminNotes: { type: String, default: null },
},
{ timestamps: true } // createdAt, updatedAt
```

Indexes useful for admin list:

- `{ status: 1, createdAt: -1 }`
- `{ type: 1, createdAt: -1 }`
- text or regex-friendly indexes on `fullName` / `email` / `phone` if search volume grows

---

## FE switch-over checklist

1. Ship schema + resolvers for `getFlexLeads`, `flexLeadCounts`, `updateFlexLead`, and public creates.
2. Confirm responses use camelCase field names listed above.
3. Admin is wired: `features/flex-leads/hooks/use-flex-leads.ts` and `use-flex-lead-actions.ts`.
4. Optionally replace `executeRaw` with `graphql()` + `npm run codegen` once staging allows introspection.
4. Wire abode-v2 public forms to `submitFlexBrochureLead` / `bookSiteInspection`.
