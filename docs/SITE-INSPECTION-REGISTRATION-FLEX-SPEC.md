# Site Inspection Registration — Abode Flex (abode-v2) Spec

Where the public site-inspection signup form lives and what it needs to do.
Companion to `SITE-INSPECTION-REGISTRATION-BACKEND-REQUEST.md` — this
assumes that doc's two endpoints exist:
`GET/POST /site-inspection/:eventId`.

## There's already a near-identical form to model this on

`abode-v2` already has the allocation-event registration form —
`app/form/page.tsx` → `features/event-registration/`
(`EventRegistrationForm.tsx`, `use-event-registration.ts`,
`event-registration.schema.ts`). It's driven by a `?token=` query param,
hits `GET/POST /event-registration/:token`, and has fields for full name,
phone, email, category (`associate_pro` / `associate` / `client`), and a
required pickup-location select.

This is the same field set the user asked for, and site inspection's form
is a simpler version of it (no token, no prefill, pickup location is
optional instead of required). Recommend cloning the module rather than
designing from scratch — same visual language, same libraries
(`@tanstack/react-query`, the shared `apiGet`/`apiPost` client), same error
handling conventions, so it reads as the same product rather than a
bolted-on feature.

## Route

`app/site-inspection/[eventId]/page.tsx` — a path segment, not a query
param, since (unlike the allocation flow) this link isn't personalized;
`eventId` is the whole identity of the link, so it belongs in the path.

```tsx
export default async function SiteInspectionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteInspectionRegistrationForm eventId={eventId} />
    </div>
  );
}
```

## New feature module: `features/site-inspection-registration/`

Mirrors `features/event-registration/`'s shape:

```
features/site-inspection-registration/
  schemas/site-inspection-registration.schema.ts
  hooks/use-site-inspection-registration.ts
  components/SiteInspectionRegistrationForm.tsx
  index.ts
```

### Schema

```ts
export const REGISTRANT_CATEGORIES = ['associate_pro', 'associate', 'client'] as const;
export const RegistrantCategorySchema = z.enum(REGISTRANT_CATEGORIES);
export type RegistrantCategory = z.infer<typeof RegistrantCategorySchema>;

export const SiteInspectionContextSchema = z.object({
  event_title: z.string(),
  asset_name: z.string(),
  date: z.string(),
  time: z.string(),
  pickup_locations: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const SubmitSiteInspectionResultSchema = z.object({ registered: z.literal(true) });
```

### Hooks

Same shape as `use-event-registration.ts`, keyed by `eventId` instead of
`token`:

```ts
const BASE = "/site-inspection";

export function useSiteInspectionContext(eventId: string) {
  return useQuery({
    queryKey: ["site-inspection", "context", eventId],
    queryFn: () => apiGet(`${BASE}/${eventId}`, SiteInspectionContextSchema),
    enabled: Boolean(eventId),
    retry: false, // a 404/400 (bad id, wrong type, not open) isn't transient
  });
}

export interface SubmitSiteInspectionInput {
  full_name: string;
  phone: string;
  email: string;
  category: RegistrantCategory;
  preferred_pickup_location_id?: string;
}

export function useSubmitSiteInspectionRegistration(eventId: string) {
  return useMutation({
    mutationFn: (input: SubmitSiteInspectionInput) =>
      apiPost(`${BASE}/${eventId}`, input, SubmitSiteInspectionResultSchema),
  });
}
```

## Component behavior — differences from `EventRegistrationForm.tsx`

Start from a copy of that component and change:

1. **No token, no prefill.** `EventRegistrationForm` prefills name/email/
   phone from the allocation's linked user record (`context.data.prefill`).
   There's no equivalent person to prefill from here — every field starts
   blank. Drop the `prefill`-driven `useEffect` entirely.

2. **Pickup location is conditional, not required.** Only render the
   pickup-location `<select>` when `data.pickup_locations.length > 0`; when
   it's empty (the common case per the backend doc — site inspections
   usually won't have any configured), omit the field and don't include
   `preferred_pickup_location_id` in the submit payload at all. `canSubmit`
   should only require it when the list is non-empty.

3. **No "already registered" state from context.** `EventRegistrationForm`
   knows upfront whether this specific person already registered
   (`data.already_registered`, resolved server-side from the allocation).
   There's no per-person identity here until a form is actually submitted,
   so this doc's context endpoint doesn't return that flag — drop that
   branch. The only "already submitted" state is the local `submitted`
   client state right after a successful POST (same as the existing form
   already does as a fallback). If the backend decides to reject duplicate
   `(event_id, email)` submissions (open question in the backend doc), add
   back a 409-handling branch identical to the existing form's — the
   pattern's already there to copy.

4. **Copy changes.** "Abode Company Event" → "Abode Site Inspection Day" (or
   similar); drop any implication of a boarding pass/QR/bus — there's no
   checkpoint downstream of this form the way the allocation flow's
   boarding QR exists. The confirmation card should read as "you're on the
   list for this site visit," not reference boarding at all.

5. **Everything else — layout, field styling, loading/error states, the
   `Field` helper, the invalid-link card — stays the same.** The point is a
   smaller, blank-slate version of the same form, not a different design.

## What's explicitly NOT needed here

- No QR code, no email with an attachment, no `/checkin`-style downstream
  page — a site-inspection registration doesn't feed into the boarding
  kiosk or the offline ground-confirmation scanner at all. Those only exist
  for `type: 'allocation'` events (`EventAllocation.checked_in_at`/
  `confirmed_at` have no equivalent concept for a site inspection).
- No capacity/eligibility messaging — there's nothing to be ineligible for.

## Where the link comes from

Not generated by this app. The admin app (`abode-fe-admin`) constructs and
displays `{FRONTEND_URL}/site-inspection/{event_id}` on the event's detail
page for an admin to copy and share however they choose (WhatsApp, email
blast, a QR on a physical flyer, etc.) — this repo only needs to render
whatever lands on that route correctly.
