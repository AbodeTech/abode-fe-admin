# Company Events — Site Inspection & Allocation Flow (Implementation Map)

> Status: **in build.** The admin-side create-event + allocation-table slice (§3.1–§3.2)
> is built and wired to the real `abode-be-v2` backend, which shipped
> 2026-09-11 (PR #67 "allocation-event"). PR #69 ("company-events-offline")
> then added `GET /:id/allocations`, `GET /:id/analytics`, and
> `GET /:id/registrations` — the one gap `docs/BACKEND-REQUESTS.md` item 30
> tracked is now resolved and fully integrated (Allocated table, Analytics
> tab, and a new Registrations tab are all real). Email, the public
> registration form, QR check-in, and the offline scanner (§3.3–§3.6) remain
> unbuilt on the admin side — `docs/COMPANY-EVENTS-OFFLINE-SCANNER-PLAN.md`
> has the design for the last of those. Kept below as the original planning
> reference.

## Context

Company Events (site inspection days + allocation days) currently has **on-hold placeholder shells** in `abode-fe-admin`:
- `app/(dashboard)/company-events/page.tsx` — ABO-22, marked "ON HOLD (ABO-22–26)"
- `app/(dashboard)/company-events/new/page.tsx` — ABO-23 shell, comment already anticipates "estate, date, type (site inspection / allocation day), registration status, pickup points with seat limits"

Separately, `abode-fe-admin` already has a substantial **`features/allocation/`** module (eligible-clients table, filters, per-client plot allocation via modal, allocation history) that covers one-off individual plot assignment against `abode-be-v2`. This plan **extends/reuses** that module rather than rebuilding it, per team direction — but the new "event allocation" flow is a different shape (bulk, capacity-gated, tied to a scheduled event) layered on top of the same eligibility source, not a copy of the existing "Assign Plots" modal flow.

QR check-in has working prior art: `docs/CHECKIN-KIOSK-MIGRATION.md` documents a full kiosk (PIN-gated public page, camera scan via `@zxing/browser`, manual-paste fallback, search fallback) that shipped once in `abode-fe-admin` and is being moved to a public "Academy site." Per team direction, the **new public registration form and QR kiosk both live in `abode-v2`** (referred to as the abodeflex public site), reusing this exact pattern rather than inventing a new one.

**Goal of this document:** a self-explanatory map of features → components → endpoints → DTOs for the team to review and sequence, not something to be auto-implemented.

---

## 1. System map — who owns what

```
abode-fe-admin (admin dashboard, this repo, private/auth)
  └─ Company Events: create/manage events, run the allocation table,
     view registration + allocation metrics dashboards.
     Talks to abode-be-v2 via REST (/api/v1), React Query + Zod, per CLAUDE.md.

abode-v2 (public site, "abodeflex.ng" — in Abode-Combine)
  └─ Public, unauthenticated: /form registration page, /checkin kiosk
     (bus-boarding scan + ground-allocation scan). Reuses the ported
     CheckinKioskPage pattern from CHECKIN-KIOSK-MIGRATION.md.

abode-be-v2 (NestJS + Mongo, in Abode-Combine/Abode-Backend — the REAL backend
  both FE apps talk to)
  └─ All new endpoints/DTOs/schemas below live here.

Abode-Backend/abode-BE (legacy GraphQL backend, inside THIS repo)
  └─ Reference only — existing Plot/Block/PaymentPlan business rules
     (dev levy fields, site names, email templates, contract docs).
     Not where new code goes.
```

**Terminology settled:** "statutory fee" = "dev levy" (same thing, per team). Eligibility is a two-tier status: `land` (land payment complete) vs `land_and_dev_levy` (land + dev levy complete). The existing `PaymentPlan` model already has `land_payment_completed_date` and `dev_levy_email_*_sent` fields to derive this from — no "statutory fee" field needs to exist separately.

---

## 2. New data model (abode-be-v2)

Four new collections/concepts, all referencing existing `PaymentPlan`/`User`/`Asset` documents rather than duplicating them:

### `CompanyEvent`
```ts
{
  _id: ObjectId,
  title: string,                       // e.g. "Empire Park — October Allocation"
  type: 'site_inspection' | 'allocation',
  asset_id: ObjectId,                  // ref existing Asset (Empire Park, Green City, ...)
  date: string,                        // ISO date
  time: string,                        // HH:mm, event's own timezone (see §6 gaps)
  pickup_locations: [{ _id: ObjectId, name: string, seat_limit?: number }],
  // allocation-only fields:
  available_size: number | null,       // e.g. 10000, 25000
  size_unit: 'sqm' | 'plots' | string, // whatever unit the admin's input represents
  status: 'draft' | 'published' | 'closed',
  created_by: ObjectId,
  createdAt, updatedAt
}
```

### `EventAllocation` (one row per person saved into an event's allocation batch)
```ts
{
  _id: ObjectId,
  event_id: ObjectId,
  payment_plan_id: ObjectId,           // links back to features/allocation's existing entity
  user_id: ObjectId,
  size_reserved: number,               // snapshot of that client's plan size at save time
  eligibility_tier: 'land' | 'land_and_dev_levy',
  status: 'allocated' | 'email_sent' | 'registered' | 'checked_in' | 'confirmed' | 'cancelled',
  registration_token: string (hashed), // opaque, minted at save time — see §3.3 security note
  registered_at: Date | null,
  checked_in_at: Date | null,          // bus boarding scan
  confirmed_at: Date | null,           // ground allocation scan (final)
  actor: ObjectId,                     // admin who allocated
  createdAt, updatedAt
}
```

### `EventRegistration` (public form submission, 1:1 with `EventAllocation`)
```ts
{
  _id: ObjectId,
  event_allocation_id: ObjectId,
  full_name: string,
  phone: string,
  email: string,
  category: 'associate_pro' | 'associate' | 'client',
  preferred_pickup_location_id: ObjectId,
  submitted_at: Date
}
```

### `EventAllocationHistory` (audit trail — mirrors the existing `AllocationHistory` pattern already used by `features/allocation`)
```ts
{ _id, event_id, event_allocation_id, action: 'allocated'|'deallocated'|'email_sent'|'registered'|'checked_in'|'confirmed'|'cancelled', actor, reason?, createdAt }
```

---

## 3. Feature-by-feature map

### 3.1 Create Event page — two tabs

**Route:** `app/(dashboard)/company-events/new/page.tsx` (replaces ABO-23 shell)
**Component:** `features/company-events/components/CompanyEventForm.tsx`, using shadcn `Tabs` (`components/ui/tabs.tsx`) with two `TabsTrigger`s: "Site Inspection" / "Allocation".

**Site Inspection tab:** estate/site dropdown, date, time — a subset of the allocation form, no size/eligibility table.

**Allocation tab — location form:**
| Field | Component | Notes |
|---|---|---|
| Site | `Select` (shadcn) | options from `GET /admin/assets` (reuse `AllocationAssetOptionSchema` pattern) |
| Available size | `Input` type number, placeholder `10000` | maps to `available_size` |
| Date | `Input type="date"` or `react-day-picker` (already a dep) | |
| Time | `Input type="time"` | |
| Preferred pickup locations | **new component**, see below | multi, free-text, previewed as removable chips |

**New component needed — `PickupLocationInput`:** the existing `components/ui/multi-select.tsx` is a combobox over a **fixed** option list (select-and-badge), not a fit here since the admin *types* arbitrary location names. Build a small sibling component: text `Input` + "Add" (or Enter-to-add), each entry rendered as a removable `Badge` (same visual language as `multi-select.tsx`'s badges), backed by local component state (`string[]`) until "Create" is clicked. On submit, `POST /admin/company-events` includes `pickup_locations: [{name}]` (or `{name, seat_limit}` if seat limits are wanted — see §6.9).

**Endpoint:** `POST /admin/company-events`
```ts
// Request DTO
{ title: string, type: 'site_inspection'|'allocation', asset_id: string, date: string, time: string,
  available_size?: number, size_unit?: string, pickup_locations?: { name: string, seat_limit?: number }[] }
// Response: the created CompanyEvent
```

### 3.2 Allocation eligibility table

**Component:** `features/company-events/components/EventAllocationTable.tsx` — modeled directly on `features/allocation/components/AllocationTable.tsx` (same `AdminMobileStack`/`AdminDesktopTableWrap` responsive pattern, same `Card`/`Table` shadcn primitives) but with a **selection column** instead of a per-row "Assign Plots" action.

**Data source — extend, don't fork:** add a new endpoint rather than reusing `/admin/allocation/eligible-clients` verbatim, since this list needs to be scoped to one event's asset + size, and exclude anyone already in an `EventAllocation` row (any event, any status except `cancelled`) so someone can't be double-booked across events:

`GET /admin/company-events/:event_id/eligible-clients`
```ts
// Query DTO (mirrors AllocationClientFilters shape/conventions)
{ page?, limit?, search?, eligibilityTier?: 'land'|'land_and_dev_levy', sortBy?, order? }

// Response row (extends AllocationClientSchema's shape with one new field)
{ payment_plan_id, user_id, name, email, phone, size, eligibility_tier: 'land'|'land_and_dev_levy', date_joined, ... }
```
`eligibility_tier` is a new **backend-computed** field (not in the current `AllocationClientSchema`): `land_and_dev_levy` when `land_payment_completed_date` is set AND dev levy is fully paid, else `land` when only land payment is complete. Ordering is first-come-first-serve by `date_joined`/`land_payment_completed_date` ascending (backend default sort — don't leave FCFS ordering to the client).

**Filters UI:** clone `AllocationFilters.tsx` — keep the search input, swap the "Payment %"/"Allocation status" selects for a single "Eligibility" select (`All` / `Land` / `Land + Dev Levy`).

**Selection & capacity logic (client-side until save):**
- `EventAllocationTable` takes `event.available_size` as a prop and keeps local `selected: Map<payment_plan_id, size>` state.
- Each row gets a toggle (checkbox or a small "Allocate"/"Remove" button per row, per the ask).
- A sticky footer/indicator: `Σ(selected sizes) / available_size` (e.g. "18,000 / 25,000 sqm allocated"), styled as a progress bar; turns red/disables further selection once at capacity.
- "Save allocation" button: `disabled={runningTotal > available_size || selected.size === 0}` — enabled state is a **client-side UX convenience only**; the backend must re-validate on save (see next point — concurrency).

**Save endpoint:** `POST /admin/company-events/:event_id/allocations`
```ts
// Request DTO
{ payment_plan_ids: string[] }

// Response — partial-success shape (see §6.1 on concurrency: some ids may fail
// server-side re-validation even though the client's running total looked fine)
{
  succeeded: { payment_plan_id: string, event_allocation_id: string }[],
  failed: { payment_plan_id: string, reason: 'ALREADY_ALLOCATED'|'NO_LONGER_ELIGIBLE'|'CAPACITY_EXCEEDED' }[],
  remaining_capacity: number
}
```
On success, succeeded rows: (a) create `EventAllocation` docs, (b) leave the eligible list (the `eligible-clients` endpoint excludes anyone with a non-cancelled `EventAllocation`), (c) enqueue the allocation email (§3.3). Any `failed` rows should re-surface as an inline table error (toast + row-level flag), not silently drop the person.

### 3.3 Allocation email

**Trigger:** enqueued by the save-allocations endpoint above (reuse the existing email job-queue pattern from `Abode-Backend/abode-BE/src/job/queues` and `email.templates.ts` as a structural reference — but note the **known bug** in the current allocation email path: `SendAllocationEmailResultSchema`'s doc comment records that `type: 'allocation-document'` has no processor/template case yet and silently fails after reporting `queued: true`. Don't repeat that gap — add the new template (`event-allocation-invite`) to `email.templates.ts`/the queue processor *before* wiring the send call, and add a delivery-status field so "queued" isn't conflated with "delivered.")

**Content:** warm, brief — informs them they've been allocated, asks them to fill their details, one CTA button.

**CTA link:** `https://abodeflex.ng/form?token=<registration_token>` — **not** the raw `payment_plan_id`/`event_allocation_id` (§6.6: this is a public unauthenticated page — an enumerable id would let anyone probe other people's allocations). Mint an opaque random token per `EventAllocation`, store only its hash server-side (same shape as a password-reset token), single-use-until-submitted.

**QR code:** embedded in the same email, encodes `https://abodeflex.ng/checkin?token=<same or a second token>&purpose=boarding` — deliberately modeled on the existing kiosk contract (`CHECKIN-KIOSK-MIGRATION.md` §3's `qr_payload` = URL with an id param), except using a signed/opaque token instead of a raw id for the reason above (bus boarding gates a physical resource, same trust bar as the ground scan).

### 3.4 Public registration form (`abode-v2`)

**Route:** `abode-v2/app/form/page.tsx` (public, reads `?token=` from URL — same "public route, no admin auth" pattern the kiosk migration doc already establishes for `/checkin`).

**Fields:** full name, phone, email, "what best describes you?" (`Select`: Associate Pro / Associate / Client), preferred pickup location (`Select`, options fetched from the event via the token — `GET /event-registration/:token` returns the event's `pickup_locations` alongside prefill data).

**Endpoint:**
```
GET  /event-registration/:token   → { event_title, asset_name, date, time, pickup_locations: [{_id, name}] }
POST /event-registration/:token   → body: { full_name, phone, email, category, preferred_pickup_location_id }
                                     → creates EventRegistration, flips EventAllocation.status to 'registered',
                                       invalidates the token for further submits (single-use)
```
Validate token server-side on both calls; expired/consumed/unknown token → a friendly "this link is no longer valid" state, not a raw 404/500.

### 3.5 QR check-in — bus boarding (`abode-v2`)

Directly reuse the ported kiosk: `features/checkin/{schemas,hooks,components}` per `CHECKIN-KIOSK-MIGRATION.md` §4/§6, retargeted:
- `checkin.schema.ts` stays structurally the same; swap `CheckinSession` = a `CompanyEvent`, `CheckinSearchRow` = an `EventAllocation` joined to name/email/phone.
- `use-checkin.ts` hooks point at new paths (below) instead of `/checkin/sessions/*`.
- `CheckinKioskPage.tsx` — reused **as-is** (camera scan via `@zxing/browser`, manual paste, search fallback, running counts footer, success/already/not-found overlay). This is the "check in as they board the bus" requirement from the ask, and it's already built.

**Endpoints (mirrors the documented contract exactly, new base path):**
```
GET  /checkin/events                          → events with active/upcoming allocation
GET  /checkin/events/:event_id/stats          → { checked_in, total, remaining }
GET  /checkin/events/:event_id/search?q=      → matching EventAllocation rows
POST /checkin/events/:event_id/check-in       → { token } → sets checked_in_at, action='boarding'
```
Auth: same PIN-header model (`x-checkin-pin`) as the migration doc — a shared device PIN, not per-user login, since this runs on a bus-side volunteer's phone.

### 3.6 Offline "mark as allocated" scan — allocation ground

This is **new** (no offline/IndexedDB code exists anywhere in either repo today — nothing to port here, unlike §3.5).

**Why it's a second, separate scan from boarding:** boarding (§3.5) happens getting on the bus; this happens after the physical allocation process completes on the ground, confirming the person actually received their plot that day. Two different timestamps (`checked_in_at` vs `confirmed_at`), two different failure modes (a no-show never gets a boarding scan; a boarding scan without a later ground-confirm scan is a useful "started but didn't finish" signal for ops).

**Device/approach:** staff phones/tablets, PWA — reuses the same `@zxing/browser` scan UI as §3.5, wrapped with:
1. **Pre-fetch a roster snapshot before going offline:** `GET /checkin/events/:event_id/roster` returns the full list of valid `{token_hash-comparable id, name, size}` for that event's confirmed/boarded attendees, cached into IndexedDB so a scan can be validated (found/not-found, already-confirmed) **without network**.
2. **Local write queue:** each scan writes `{ token, scanned_at, device_id, action: 'confirm' }` into an IndexedDB store immediately, and optimistically shows a local success/duplicate result from the cached roster.
3. **Sync on reconnect:** a background sync (service worker `sync` event, or a simple "online" listener + manual "Sync now" button as a fallback since background sync isn't universally supported) flushes the queue:
   `POST /checkin/events/:event_id/confirm-sync` — body: `{ scans: [{ token, scanned_at, device_id }] }` (batched, idempotent).
4. **Idempotent merge server-side:** first `confirmed_at` write for a token wins; later ones for the same token (e.g. two staff phones scanned the same person while both offline) come back tagged `outcome: 'duplicate'` in the response, not an error — surface this to the syncing device so staff know there was an overlap, but never treated as a hard failure that blocks the rest of the batch.

```ts
// POST /checkin/events/:event_id/confirm-sync — response
{ results: { token: string, outcome: 'confirmed'|'already'|'duplicate'|'invalid' }[] }
```

### 3.7 Admin dashboard — Company Events analytics

**Route:** `app/(dashboard)/company-events/analytics/page.tsx` (or a tab within `company-events`), modeled on `features/dashboard`/`features/analytics`'s existing `use-dashboard-kpis.ts` + `RevenueTimeline.tsx` (AreaChart+table combo) pattern, using the existing `components/ui/chart.tsx` Recharts wrapper.

**Required (per the ask):**
- Table of registrations (`EventRegistration` rows: name, phone, email, category, pickup location, submitted_at).
- Table of allocated people (`EventAllocation` rows saved from §3.2), with status.
- Donut chart: allocated-and-registered vs allocated-but-not-yet-registered.

**Additional metrics worth adding (see §6.7 for why):**
- **Funnel, not just a donut:** Allocated → Registered → Checked-in (boarded) → Confirmed (ground). A donut only shows one split; the funnel shows *where* people drop off, which is the actionable number for ops (e.g. "80% register but only 60% board the bus" tells you to chase no-shows, not registration).
- **No-show rate:** allocated + registered but never boarded — a financial/logistics risk metric.
- **Time-to-register histogram:** hours/days between allocation-email-sent and form submission — informs how long to wait before a reminder nudge.
- **Category mix** (Associate Pro / Associate / Client) per event and trended over time — useful for channel performance.
- **Pickup-location load:** registrations grouped by preferred pickup location vs any seat limit set on the location (§6.9) — flags an overloaded pickup point before event day.
- **Land utilization:** allocated size vs available size per event, and cumulative per site over time — capacity planning across Empire Park/Green City/etc.
- **Cycle time:** event creation → fully allocated → fully registered, to spot slow-moving events.

---

## 4. Endpoint summary (abode-be-v2)

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/company-events` | create event (both tabs) |
| GET | `/admin/company-events` | list events |
| GET | `/admin/company-events/:id` | event detail |
| GET | `/admin/company-events/:id/eligible-clients` | paged eligibility list, FCFS-sorted |
| POST | `/admin/company-events/:id/allocations` | save selected batch, capacity re-validated server-side |
| DELETE | `/admin/company-events/:id/allocations/:allocation_id` | de-allocate after save (§6.5) |
| GET | `/admin/company-events/:id/registrations` | registrations table (dashboard) |
| GET | `/admin/company-events/:id/metrics` | funnel/no-show/pickup-load/etc. |
| GET | `/event-registration/:token` | public — prefill data for /form |
| POST | `/event-registration/:token` | public — submit registration |
| GET | `/checkin/events` | kiosk — active events |
| GET | `/checkin/events/:id/stats` \| `/search` | kiosk — live counts / lookup |
| POST | `/checkin/events/:id/check-in` | kiosk — boarding scan |
| GET | `/checkin/events/:id/roster` | offline pre-fetch for ground scanner |
| POST | `/checkin/events/:id/confirm-sync` | offline ground scanner — batched sync |

---

## 5. Frontend component/file map (abode-fe-admin)

```
features/company-events/
  schemas/
    company-event.schema.ts       (CompanyEvent, EventAllocation, EventRegistration Zod schemas)
  hooks/
    query-keys.ts
    use-company-events.ts / use-create-company-event.ts
    use-event-eligible-clients.ts     (mirrors use-allocation-clients.ts)
    use-save-event-allocations.ts     (mirrors use-allocate-land.ts's mutation shape)
    use-deallocate-event-client.ts
    use-event-registrations.ts / use-event-metrics.ts
  components/
    CompanyEventForm.tsx              (Tabs: site inspection / allocation)
    PickupLocationInput.tsx           (new — free-text chip input)
    EventAllocationFilters.tsx        (clone of AllocationFilters.tsx, eligibility select instead of status)
    EventAllocationTable.tsx          (clone of AllocationTable.tsx, selection + capacity footer)
    EventRegistrationsTable.tsx
    EventAllocationDonut.tsx / EventFunnelChart.tsx   (Recharts via components/ui/chart.tsx)
```

`abode-v2` additions: `app/form/page.tsx` (public registration), `features/checkin/**` retargeted per §3.5, plus new offline-queue module (`features/checkin/lib/offline-queue.ts`, IndexedDB via a small wrapper — no existing dependency for this, `idb` is a reasonable lightweight addition) for §3.6.

---

## 6. Gaps / angles worth deciding before build (flagging, not deciding for the team)

1. **Concurrency on save:** the client's capacity indicator is UX only. Two admins working the same event simultaneously, or a client's eligibility changing mid-session, must be re-checked server-side in `POST .../allocations` (hence the partial-success response shape in §3.2) — don't trust the browser's running total.
2. **Table freshness:** should `eligible-clients` poll/refetch periodically so an admin doesn't select someone who just got allocated by someone else, or is refetch-on-focus enough? Affects React Query config.
3. **Waitlist:** if the eligible pool is larger than capacity, is there a formal "waitlisted for next event" state, or do unselected people just sit in the general pool until the next event's table is built? Nothing today distinguishes "not yet considered" from "considered and skipped."
4. **No-show / non-registration policy:** if an allocated person never submits the form, is there a deadline after which they're auto-reverted to eligible (freeing their reserved size) and re-nudged, or does this stay a manual admin action (the DELETE endpoint in §4)? Needs a TTL decision.
5. **Post-save de-allocation:** the ask covers select/deselect *before* saving; a "remove after saving" path (last-minute drop-out, freeing size back to the pool) is necessary to close the loop and is included above (`DELETE .../allocations/:id`) but wasn't explicitly requested — confirm it's wanted.
6. **Token security:** both the registration link and the QR codes must use opaque/signed tokens, not raw Mongo ids — this gates a public unauthenticated page and a physical resource (bus seats, land), a higher trust bar than the academy kiosk this pattern is borrowed from.
7. **Offline validation needs a pre-synced roster, not just a write queue:** a scanner that's offline can't ask the server "is this token valid/already used" — it needs the roster snapshot (§3.6 step 1) fetched *before* going offline, and a plan for what happens if staff forget to pre-sync (e.g., block entry to offline mode without a roster fetched in the last N hours).
8. **Duplicate scans across two offline devices:** the idempotent-merge behavior (§3.6 step 4) needs to be visible to staff, not just logged — otherwise a real double-allocation could go unnoticed if both devices report local "success."
9. **Pickup-location seat limits:** the existing ABO-23 shell comment already anticipates "seat limits" per pickup point, which the ask's flow doesn't explicitly mention — worth confirming whether the location form should collect a seat cap per location (feeds the registration form's availability and the "pickup-location load" metric in §3.7).
10. **RBAC:** the app has a documented 40-permission system that's stored but not FE-enforced yet (per `CLAUDE.md`) — decide whether Company Events gets a dedicated permission and whether this is the moment to start enforcing it, or ships open like the rest of the dashboard.
11. **Why ABO-22–26 were put on hold:** worth checking with whoever deferred them before restarting — may surface a blocking dependency (e.g. backend endpoints not scheduled) that changes sequencing.
12. **Audit trail:** `EventAllocationHistory` (§2) mirrors the existing `AllocationHistory` pattern already proven in `features/allocation` — confirm the team wants the same traceability here (who allocated/deallocated whom, when).
13. **Export:** `features/allocation/hooks/use-allocation-export.ts` is an existing CSV-export pattern — the eligible/allocated/registrations tables here are natural candidates for the same treatment for ops/offline reporting.
14. **Timezone handling:** event `date`/`time` inputs need an explicit timezone decision (store UTC, display in a fixed business timezone?) especially since the public form and two separate mobile kiosk apps all need to agree on "today's event."

---

## 7. Suggested build sequence

1. **Backend foundation:** `CompanyEvent`, `EventAllocation`, `EventRegistration` schemas + the `eligible-clients`/`allocations` endpoints (§2–§4) — everything else depends on this.
2. **Admin: create event + allocation table** (§3.1–§3.2) — the core admin workflow, testable end-to-end without email/public form yet (can allocate and inspect via API/DB).
3. **Email + public registration form** (§3.3–§3.4) — closes the loop to a real registrant.
4. **QR boarding kiosk** (§3.5) — lowest-risk QR piece since it's a near-verbatim port of proven code.
5. **Offline ground-confirmation scanner** (§3.6) — highest engineering risk (net-new offline architecture), sequence last so the roster/token model it depends on is already stable.
6. **Dashboard analytics** (§3.7) — needs real data flowing through steps 1–5 to be meaningful to build against.

---

## 8. Verification approach (once building starts)

- Backend: unit tests per endpoint per the existing `abode-be-v2` Jest conventions, especially the capacity-recheck and token-validation edge cases (expired/consumed/unknown token, over-capacity save, duplicate offline sync).
- Frontend: `NEXT_PUBLIC_USE_MOCKS=true` mock routes for each new endpoint (following `lib/mocks/routes/` convention) so the admin UI is buildable/demoable before `abode-be-v2` ships the real routes — same approach the existing `features/allocation` module already relies on.
- Manual E2E walkthrough before sign-off: create event → allocate batch at exactly capacity (confirm button disables correctly) → email received → public form submit → QR boarding scan → take scanner offline → ground-confirm scan while offline → reconnect → confirm sync reconciles → dashboard funnel reflects all four stages.
