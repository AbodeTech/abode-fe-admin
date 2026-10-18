# Site Inspection Registration — Backend Request

**Priority: high — a site inspection event currently has no working flow at all
past creation.** An admin creates one, gets dropped on its detail page, and
sees a static "anyone can attend" message with no way to see who's coming or
share a signup link. This doc specifies the two public endpoints and one
schema change needed to close that gap.

## Why this is a new ask, not a reuse of the allocation registration flow

`abode-be-v2` already has a public registration flow
(`event-registration.controller.ts` / `.service.ts`,
`GET/POST /event-registration/:token`), but it is **architecturally gated on
a pre-existing `EventAllocation`**: `resolve(token)` hashes the token and
looks up `findAllocationByTokenHash()` — there is no path through this code
that doesn't require an `EventAllocation` row to already exist.

Site inspection events never have `EventAllocation` rows. There's no
eligible-clients list, no capacity, no per-person pre-allocation — "anyone
can attend" is the whole point (confirmed in
`company-events-admin.controller.ts`: `eligible-clients`, `allocations`,
`analytics` are all real routes but every one of them either requires
`type: 'allocation'` or operates on data that only exists for that type).
So the token-per-person model the allocation flow depends on has nothing to
attach to for a site inspection — this needs its own, simpler public
endpoint pair, not a token.

## What we need

### 1. `GET /site-inspection/:eventId` (public, unauthenticated)

Prefill/context data for the public form — same job as
`GET /event-registration/:token`'s `getContext()`, but keyed by the event id
directly since there's no per-person token to resolve.

```ts
// 200 response
{
  event_title: string,
  asset_name: string,
  date: string,        // yyyy-mm-dd
  time: string,        // HH:mm
  pickup_locations: { id: string, name: string }[], // often []
}
```

Guards:
- 404 if the event doesn't exist (`EVENT_NOT_FOUND`, already defined).
- 400 if `event.type !== 'site_inspection'` — propose a new code,
  `NOT_A_SITE_INSPECTION_EVENT`, mirroring the existing
  `NOT_AN_ALLOCATION_EVENT` (`company-events.errors.ts`) so an allocation
  event's id can't be used here by mistake.
- Something friendly for `status === 'draft'` — unlike the allocation flow
  (whose link only ever exists because an admin already ran a batch save,
  implicitly meaning the event is live), a site-inspection link is a bare
  `/site-inspection/{event_id}` URL an admin could copy and share **before**
  publishing. Recommend reusing `EVENT_CLOSED`'s shape for both `draft` and
  `closed` states with a status-appropriate message, rather than adding two
  new codes for what's functionally one "not open for registration" state.

Same public rate limit class as `event-registration` (`PUBLIC_LIMIT`,
30/min) seems right — no reason this needs looser or tighter limits.

### 2. `POST /site-inspection/:eventId` (public, unauthenticated)

```ts
// body
{
  full_name: string,
  phone: string,
  email: string,
  category: 'associate_pro' | 'associate' | 'client', // reuses REGISTRANT_CATEGORIES, no new enum
  preferred_pickup_location_id?: string, // optional — see note below
}

// 200 response
{ registered: true }
```

Creates an `EventRegistration` document directly:
`{ event_id, event_allocation_id: null, full_name, phone, email, category,
preferred_pickup_location_id: <ObjectId | null>, submitted_at: now }` — no
token, no single-use flip on an allocation (there isn't one), no capacity
check (there's no capacity to check).

Guards: same `NOT_A_SITE_INSPECTION_EVENT` / not-open-for-registration checks
as endpoint 1. `preferred_pickup_location_id`, when present, should validate
against `event.pickup_locations` the same way `PICKUP_LOCATION_INVALID`
already does for the allocation flow.

**`preferred_pickup_location_id` is optional** because the admin FE
currently doesn't even collect pickup locations when creating a
site-inspection event (`CompanyEventForm.tsx` only exposes that field for
`type: 'allocation'`) — so most site-inspection events will have
`pickup_locations: []`. The DTO/schema already technically allow adding them
to either type (`CreateCompanyEventDto.pickup_locations` isn't type-gated),
so this is future-proofed for whenever the admin form is extended to offer
it, without blocking on that now.

### 3. Schema change: `EventRegistration.event_allocation_id` must become optional

Currently (`schemas/event-registration.schema.ts`):

```ts
@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EventAllocation', required: true, unique: true })
event_allocation_id!: Types.ObjectId;
```

`unique: true` on a field that will now sometimes be `null` for many rows
(every site-inspection registrant) needs a partial/sparse index instead of a
plain unique one, or every second site-inspection signup will collide on
the existing unique index. The repo already has this exact pattern
elsewhere for the same reason — `event-allocation.schema.ts`'s `token_hash`
index is explicitly partial-unique "so the many pre-token/cancelled rows
don't collide on null." Recommend the same treatment here:

```ts
@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EventAllocation', required: false, default: null })
event_allocation_id!: Types.ObjectId | null;

// index definition, partial:
EventRegistrationSchema.index(
  { event_allocation_id: 1 },
  { unique: true, partialFilterExpression: { event_allocation_id: { $type: 'objectId' } } },
);
```

## Why reusing `EventRegistration` (rather than a new collection) is the right call

The admin-facing "Registrants" table this doc's companion FE work needs is
**already built** — `GET /admin/company-events/:id/registrations`
(`company-events-admin.controller.ts`, shipped PR #69) already queries
`EventRegistration` by `event_id` alone, with no assumption that a matching
`EventAllocation` exists. Once site-inspection rows land in the same
collection with `event_allocation_id: null`, that endpoint — and the whole
admin table/CSV-export UI already wired to it in `abode-fe-admin` — works
for site inspections with **zero further backend or admin-FE change**. A
parallel `SiteInspectionRegistrant` collection would mean duplicating that
list/export endpoint and the admin table for no real benefit, since the
fields needed (`full_name`, `phone`, `email`, `category`,
`preferred_pickup_location_id`, `submitted_at`) are already exactly what
`EventRegistration` has.

`GET /admin/company-events/:id/analytics` throwing
`NOT_AN_ALLOCATION_EVENT` for a site-inspection id is correct and doesn't
need to change — there's no funnel/capacity/no-show concept for an
open-attendance event.

## No new endpoint needed for the link itself

Unlike the allocation flow (where each person gets an individually minted,
emailed token), a site-inspection link is not personalized — it's one
public URL per event: `{FRONTEND_URL}/site-inspection/{event_id}`. No
minting, no email-send trigger. The admin FE can construct, display, and
let an admin copy this URL client-side from the event id it already has —
nothing server-side needs to generate it.

## Open questions (flagging, not deciding)

1. **Duplicate submissions.** The allocation flow's single-use guarantee
   comes from the token being tied to one specific, already-identified
   person. A site-inspection link has no such anchor — the same person could
   submit twice, accidentally or otherwise. Options: allow duplicates and
   let admins dedupe manually from the table (simplest, matches "anyone can
   attend" spirit), or reject a second submission with the same
   `(event_id, email)` pair, returning `ALREADY_REGISTERED` (409, code
   already exists) for consistency with the allocation flow's error
   vocabulary. No strong recommendation either way — depends on how staff
   plan to use the registrant list.
2. **Confirmation email.** The allocation flow's confirmation email exists
   because it carries the boarding QR for a real checkpoint (the bus). A
   site inspection has no bus, no boarding, no ground confirmation — there's
   nothing that email would functionally need to deliver. Recommend
   skipping it for v1 unless there's a marketing/reminder reason to send
   one; easy to add later without any client-visible contract change.
3. **Status gate wording** (draft vs closed) — noted above; needs a real
   decision on whether these are one error code or two.
