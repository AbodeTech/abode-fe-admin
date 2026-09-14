# Academy Admin Module — Backend Contract (FE → BE)

Version: 2.1  
Date: 2026-09-09  
Status: Programmes/cohorts CRUD + public registration are **live** on `abode-be-v2` staging (`feature/academy-admin-module`, merged into `staging` at `202ead2`). Everything else below (dashboard, registrants list, referrals, tests, sessions/schedule) is still FE-mocked. Target base path: `/api/v1`.  
Source of truth for FE shapes: Admin Zod schemas + `lib/mocks/routes/{academy,meetings}.ts` + Academy `lib/public-*.ts`, cross-checked against `abode-be-v2/src/modules/academy/*`.

**Since v2.0 (verified against the real `abode-be-v2` implementation, 2026-09-09):**
- Cohort update is **three endpoints, not one PATCH**: core fields (`PATCH /cohorts/:id`), `registration_open` (`POST /cohorts/:id/toggle-registration`), `is_default` (`POST /cohorts/:id/set-default`). Sending the latter two in the PATCH body does nothing — the DTO doesn't declare them.
- **Cohort has no `is_active`.** Only Programme carries the kill switch.
- Programme's derived fields are `default_cohort` (not `latest_cohort`), `open_cohort_count`, and a top-level `register_url` — none of these are stored, all computed at read time.
- Cohort gained a derived `session_count` — **hardcoded to `0` on the real BE today**; nothing writes cohort-scoped sessions yet (see DC-02 note below).
- A cohort **always starts closed** (`registration_open: false`) — `CreateCohortInput` has no `registration_open` field at all. Open it afterward via `toggle-registration`.
- `PATCH /admin/academy/programmes/:id` (rename/re-describe) exists and is wired on the FE (`usePatchProgramme`), though no UI calls it yet.
- **DC-02's `schedule` block is not implemented on the real BE.** Creating a cohort does not create sessions atomically — that's explicitly deferred ("Phase 2 plugs in here," per the BE's own code comment) until the meetings module supports cohort-scoped sessions/series. The FE's Schedule block and atomic-create UI currently only work against the mock.
- Confirmed independently-built and compatible: no `type` on Programme, permissions (`view_academy`/`manage_academy`/`export_academy`), and guest→associate promotion on first login (keyed on `Registration.was_existing` + `User.created_via`) — the exact plumbing DC-07's Outcomes block needs.

**Since v1.0 (DC-01–07):**
- Programme has no `type` — a name is its whole identity (DC-01).
- Cohort no longer carries `event_date` / `event_venue` / `event_city` / `date_confirmed` — the physical day is a **session**, built from a `schedule` at create time in one atomic call (DC-02). Cohort gained `registration_opens` / `registration_closes`.
- Meeting gained `city` and `date_confirmed` (physical sessions) — `date_confirmed` gates QR issuance, matching what used to live on the cohort.
- The global `POST /admin/meetings` create form no longer takes a kind/access question when unscoped — physical sessions are created only from inside a cohort (DC-03).
- Cohort Settings (`PATCH /admin/academy/cohorts/:id`) now has real fields: name, label, registration_goal, registration_opens/closes, registration_open, is_default (DC-04).
- Cohort dashboard payload gained `outcomes` — registered → acquired → associate → associate-pro, all-time, not date-filtered (DC-07).
- Lifecycle emails move to `abode-be-v2`'s existing template pattern under `academy-*` keys — `features/event-emails` and the admin `/email-designs` page are gone from this app (DC-05).
- The check-in kiosk is no longer an Admin page — it belongs on the Academy site as a public, PIN-gated route. `Check-in` is gone from the Admin sidebar and `/admin/checkin/*` is no longer mocked here; the endpoints move to public + PIN auth (DC-06).

**Out of scope here:** Company events ABO-22–26 (ON HOLD). Email **delivery** (ABO-70–73) — template port target only, no send API in this repo.

---

## 0. Completed FE tasks this contract supports

| ID | Task | App | Status |
|---|---|---|---|
| ABO-5 | Events nav (Meetings / Recruitment / Check-in / Email designs / Company Events shell) | Admin | Done |
| ABO-6 | Meetings list (standalone + series) | Admin | Done (mocked) |
| ABO-7 | Meeting create/edit form (online/physical, cohort, recurrence) | Admin | Done (mocked) |
| ABO-8 | Series detail | Admin | Done (mocked) |
| ABO-9 | Public series link resolve | Academy | Done (mocked) |
| ABO-10 | Session join (restricted / open / walk-in) | Academy | Done (mocked) |
| ABO-11 | Programme management | Admin | Done (mocked) |
| ABO-12 | Cohort management | Admin | Done (mocked) |
| ABO-13 | Cohort dashboard | Admin | Done (mocked) |
| ABO-14 | Cohort registrants | Admin | Done (mocked) |
| ABO-15 | Cohort referral leaderboard | Admin | Done (mocked) |
| ABO-16 | Cohort sessions | Admin | Done (mocked) |
| ABO-17 | Cohort tests | Admin | Done (mocked) |
| ABO-18 | Public registration | Academy | Done (mocked) |
| ABO-19 | Public test | Academy | Done (mocked) |
| ABO-20 | Physical session QR delivery | Academy | Done (mocked) |
| ABO-21 | Check-in kiosk | ~~Admin~~ Academy (public, PIN) | Moved off Admin (DC-06) — kiosk component ports as-is to Academy; nothing left mocked here |
| ABO-27 | Event email designs | ~~Admin~~ abode-be-v2 | Copy ports to `email.templates.ts` under `academy-*` keys (DC-05); `/email-designs` removed from Admin nav |
| ABO-28 | FE QA hub + checklist | Cross | Done |

**ON HOLD:** ABO-22–26 company events.

**Envelope (Admin REST):** BE wraps payloads as `{ success, message, data, meta? }`. FE `api-client` unwraps `data` / paged `{ data, meta }`.

**Pagination meta:** `{ total, page, limit, totalPages }`

**Auth:** Admin routes require admin JWT + permissions `view_academy` | `manage_academy` | `export_academy` | `view_meetings` | `manage_meetings` as applicable. Public Academy routes are unauthenticated (rate-limit recommended).

---

## 1. Core data structures

### 1.1 Programme

DC-01 — a programme has a name and that's its whole identity; nothing branches on `type`. If a reporting rollup is ever wanted (e.g. grouping several masterclasses), add an optional `category` then — don't resurrect `type`. `cohort_count`, `open_cohort_count`, `default_cohort` and `register_url` are all derived at read time — never stored.

```ts
{
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  cohort_count: number
  open_cohort_count: number
  default_cohort: Cohort | null
  cohorts?: Cohort[]
  register_url: string
  createdAt: string  // ISO
  updatedAt: string
}
```

### 1.2 Cohort

DC-02 — the physical day is a **session**, not a cohort field. `event_date` / `event_venue` / `event_city` / `date_confirmed` are gone from Cohort; they live on the physical Meeting (1.5) instead. Registration window fields are named `registration_opens` / `registration_closes` (was informally "starts/ends"). **No `is_active`** — the kill switch lives only on Programme. `registrant_count`, `session_count` and `register_url` are derived at read time, never stored; `session_count` is hardcoded `0` until Phase 2 wires cohort-scoped sessions (§2.1 note).

```ts
{
  id: string
  programme_id: string
  name: string
  slug: string
  label: string
  registration_goal: number
  is_default: boolean
  registration_open: boolean
  registration_opens: string | null
  registration_closes: string | null
  registrant_count: number
  session_count: number
  register_url: string
  createdAt: string
  updatedAt: string
}
```

### 1.3 Registrant

```ts
{
  id: string
  cohort_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: string
  age_bracket: string
  status: string
  region: string
  is_abode_associate: string   // e.g. 'yes' | 'no'
  previous_attendee: string
  referral_source: string
  referred_by_username: string | null
  checked_in: boolean
  checked_in_at: string | null
  createdAt: string
}
```

### 1.4 Referral leaderboard row

```ts
{
  username: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  total_referred: number
  checked_in_count: number
  attendance_count: number
}
```

### 1.5 Meeting

```ts
type Audience = 'all_associates' | 'associate_pro_plus' | 'associate_only'
type SessionKind = 'general' | 'recruitment' | 'training'
type AccessType = 'online' | 'physical'

{
  id: string
  slug: string
  name: string
  google_meet_url: string          // empty for physical
  audience_type: Audience
  audience_label: string
  share_url: string
  starts_at: string
  verification_lead_minutes: number
  duration_minutes: number
  ends_at: string
  is_active: boolean
  verification_count: number
  session_kind: SessionKind
  access_type: AccessType
  venue: string | null
  city: string | null              // physical only (DC-02)
  date_confirmed: boolean          // physical: gates QR issuance (ABO-20, DC-02) — this is what used to be Cohort.date_confirmed
  cohort_id: string | null
  cohort_label: string | null
  series_id: string | null
  series_slug: string | null
  series_name: string | null
  series_position: number | null
  series_total: number | null
  cancelled_at: string | null
  createdAt: string
  updatedAt: string
}
```

**Meeting detail** = Meeting +:

```ts
stats: {
  total_verifications: number
  by_referral_status: { referral_status: string; count: number }[]
}
```

### 1.6 Meeting series

```ts
{
  id: string
  slug: string
  name: string
  share_url: string
  session_kind: SessionKind
  access_type: AccessType
  audience_type: Audience
  audience_label: string
  cohort_id: string | null
  cohort_label: string | null
  is_active: boolean
  cancelled_at: string | null
  sessions: Meeting[]
  stats: {
    total_sessions: number
    completed_sessions: number
    upcoming_sessions: number
    cancelled_sessions: number
    total_attendance: number
    drop_off_rate: number
  }
  createdAt: string
  updatedAt: string
}
```

### 1.7 Meeting verification (attendance online)

```ts
{
  id: string
  user: string | null
  email: string
  first_name: string
  last_name: string
  phone: string | null
  referral_status: string | null
  region: string | null
  verified_at: string
  source: 'existing_user' | 'existing_registrant' | 'new_registrant' | string
  createdAt: string
}
```

### 1.8 Cohort test

**Shipped in PR #65 (2026-09-09) — verified against real source, two corrections from the original speculative shape below:** `eligibility_type` has no `'none'` value — every test is gated on session or series attendance, required. `TestAttempt`'s `score`/`passed`/`correct_count`/`total_count`/`submitted_at` are all nullable — an attempt row exists once a draft is saved, before submission.

```ts
type Eligibility = 'session' | 'series_n_of_m'

{
  id: string
  cohort_id: string
  slug: string
  title: string
  description: string | null
  eligibility_type: Eligibility
  eligibility_meeting_id: string | null
  eligibility_series_id: string | null
  eligibility_required_count: number | null
  eligibility_label: string
  opens_at: string
  closes_at: string | null
  duration_minutes: number
  pass_mark: number
  is_active: boolean
  question_count: number
  attempt_count: number
  public_url: string
  questions?: TestQuestion[]   // admin create/detail; strip correct_answer on public verify
  createdAt: string
  updatedAt: string
}

TestQuestion = {
  id: string
  type: 'multiple_choice' | 'true_false'
  prompt: string
  options: { key: string; label: string }[]
  correct_answer: string
  position: number
}

TestAttempt = {
  id: string
  test_id: string
  email: string
  user_id: string | null
  first_name: string | null
  last_name: string | null
  score: number | null        // null until submitted
  passed: boolean | null
  correct_count: number | null
  total_count: number | null
  submitted_at: string | null
}
```

### 1.9 Check-in (physical kiosk)

```ts
CheckinSession = {
  id: string
  slug: string
  name: string
  starts_at: string
  ends_at: string
  venue: string | null
  access_type: 'physical'
  cohort_id: string
  cohort_label: string
  stats?: { checked_in: number; total: number; remaining: number }
}

CheckinSearchRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  checked_in: boolean
  checked_in_at: string | null
  registration_status: 'registered' | 'waitlisted' | 'cancelled' | string
  is_abode_associate: string
}

CheckinResult = {
  outcome: 'success' | 'already'
  id: string
  name: string
  first_name: string
  is_abode_associate: string
  registration_status: string
  checked_in_at: string | null
}
```

**QR payload:** URL containing `?id=<registration_id>` (optional `&session=<slug>`). Kiosk may also accept raw `reg_*` id.

### 1.10 Public cohort (Academy register)

```ts
{
  id: string
  slug: string
  name: string
  label: string
  registration_open: boolean
  is_default: boolean
  register_path: string
}
```

### 1.11 Public meet session meta (Academy join)

```ts
{
  slug: string
  name: string
  cohort: string | null
  cohort_label: string
  starts_at: string
  ends_at?: string
  verification_opens_at: string
  can_verify: boolean
  is_active: boolean
  access_mode: 'restricted' | 'open_recruitment'
  access_type: 'online' | 'physical'
  venue: string | null
  details_confirmed: boolean
  register_url: string
  series_slug: string | null
  series_position: number | null
  series_total: number | null
}
```

### 1.12 Lifecycle email templates (DC-05 — port to abode-be-v2's pattern) — ✅ shipped PR #65

All three in-scope templates below exist in `email.templates.ts` and are actually triggered: `academy-registration-confirmed` and `academy-checkin-qr` fire from `academy-registration.service.ts` on register / on check-in eligibility; `academy-session-reminder` fires from the new hourly `AcademyRemindersScheduler` cron. No FE-admin change needed — this section is now just a record of what shipped.

`abode-fe-admin/features/event-emails` (the old HTML-string designs, previewed at `/email-designs`) is **deleted**. The copy is right and ports as-is, but the shape does not: each email becomes a function in `abode-be-v2/src/modules/notification/email/email.templates.ts` returning `RenderedEmail`, composed from the file's existing helpers (`banner()`, `footer()`, `heading()`, `para()`, `detailsTable()`, `LOGO_IMAGE`, `FOOTER_IMAGE`) and dispatched by the `switch` in `renderTemplate` — the same pattern as the other ~45 templates there, not a bespoke renderer.

Template keys (prefix `academy-`, matching the `flex-` / `fo-` / `campaign-` convention):

| Key | Trigger | In scope |
|---|---|---|
| `academy-registration-confirmed` | on register, always | Yes |
| `academy-session-reminder` | per **session** (not per cohort — a cohort now has N sessions), day before + shortly before; skipped while the session is link-pending | Yes |
| `academy-checkin-qr` | registered **and** a physical session exists **and** `details_confirmed` | Yes |
| `academy-outing-pickup` | company events | Hold with ABO-22–26 |
| `academy-outing-review` | company events | Hold |
| `academy-waitlist` | company events | Hold |

Two things the old templates couldn't express, both required for parity:
- **QR is an attachment, not a link** — ride it as an `attachments` entry or inline `cid:`, never a public Cloudinary URL.
- **The reminder is per session** — subject/body reference the specific session and carry the join link, never the raw Meet URL.

Sending: `notificationService.enqueueEmail({ type: 'academy-registration-confirmed', to, ... })` — same bounded 5s enqueue / 5 retries as every other template. Scheduled ones (reminders, QR) follow `scheduler.service.ts`, `@Cron` with `timeZone: 'Africa/Lagos'`.

---

## 2. Admin endpoints (`/api/v1`)

### 2.1 Programmes & cohorts (ABO-11–15, 33–38)

**Live on `abode-be-v2` staging** except where noted. Verified against `academy-admin.controller.ts` 2026-09-09.

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/academy/programmes` | Query: `q`, `is_active`, `page`, `limit` → paged Programme[] (no `cohorts`) |
| POST | `/admin/academy/programmes` | Body: `{ name, description?, cohort: CreateCohortInput }` → Programme (+ cohorts). Atomic — programme and its first cohort are one write. **Not atomic with sessions** — see the `schedule` note below, still mock-only. |
| GET | `/admin/academy/programmes/:id` | Programme (+ cohorts) |
| PATCH | `/admin/academy/programmes/:id` | `{ name?, description? }` → Programme (+ cohorts). Live; no FE UI calls it yet. |
| POST | `/admin/academy/programmes/:id/toggle-active` | `{ is_active }` → Programme (+ cohorts) |
| POST | `/admin/academy/programmes/:id/cohorts` | CreateCohortInput → Cohort |
| GET | `/admin/academy/cohorts/:id` | Cohort |
| PATCH | `/admin/academy/cohorts/:id` | `{ name?, label?, registration_goal?, registration_opens?, registration_closes? }` → Cohort. **Not** `registration_open` or `is_default` — those are the next two endpoints. |
| POST | `/admin/academy/cohorts/:id/toggle-registration` | `{ registration_open }` → Cohort — open/close sign-ups |
| POST | `/admin/academy/cohorts/:id/set-default` | No body → Cohort. Atomically clears the previous default on the programme. |
| GET | `/admin/academy/cohorts/:id/dashboard` | **Not implemented on BE.** Query: `from`, `to` (YYYY-MM-DD) → dashboard aggregate — FE mock only |
| GET | `/admin/academy/cohorts/:id/registrants` | **Not implemented on BE.** Query: `search`, `page`, `limit` → paged Registrant[] — FE mock only |
| GET | `/admin/academy/cohorts/:id/referrals` | **Not implemented on BE.** paged ReferralRow[] — FE mock only |
| DELETE | `/admin/academy/cohorts/:id/registrants/:registrantId` | **Not implemented on BE.** Controlled deletion (FE expects; wire when ready) |
| GET | `/admin/academy/cohorts/:id/registrants/export` | **Not implemented on BE.** CSV (optional SkipTransform stream) |

**CreateCohortInput** (both the create-programme and add-cohort bodies):

```ts
{
  name: string
  label?: string
  registration_goal?: number
  registration_opens?: string
  registration_closes?: string
  set_as_default?: boolean   // default true
  schedule?: {                // ⚠ NOT accepted by the real BE yet — DC-02, see below
    online: { days: number; starts_at?: string; duration_minutes?: number; meet_url?: string }
    physical?: { date: string; venue: string; city: string; date_confirmed?: boolean }
  }
}
```

No `registration_open` field — a cohort **always starts closed**; open it via `toggle-registration` after creating it.

**`schedule` is DC-02's atomic session-creation block and is FE-mock-only today.** The real `CreateCohortInput` doesn't declare it — `academy.service.ts` hardcodes `session_count: 0` and the code comment marks this "the seam where Phase 2 plugs in," pending the meetings module supporting cohort-scoped sessions/series. Once live, the intent stays what DC-02 specified: `schedule.online.days` creates that many daily Meeting rows (`kind: online`, name `Day N — {cohort label}`), grouped into a series once there's more than one; blank `meet_url` creates them **link pending**; `schedule.physical` creates one `kind: physical` Meeting carrying `venue`, `city`, `date_confirmed`. One write, never a cohort insert followed by N session inserts.

**Dashboard payload (minimum):**  
`cohort`, `totalAll`, `statesCoveredAll`, `current` / `previous` breakdowns (dailyRegistrations, gender, age, status, region, referral sources, associate vs not), `rangeDays`, `comparison`, `outcomes` (below), `recent_registrants`.

**`outcomes` — DC-07, registered → acquired → associate → associate-pro.** Answers what the drive actually produced, not just sign-up volume. **All-time for the cohort, not affected by `from`/`to`.**

```ts
{
  as_of: string               // ISO — this keeps moving after the cohort closes
  cohort_age_label: string    // e.g. "5 months in" — show beside the rate, a bare "%" means nothing alone
  registered: number
  acquired: number            // was_existing: false — user.created_via is this cohort
  associate: number           // came back AND became associate
  associate_pct: number       // associate / acquired * 100
  associate_pro: number       // cross-checked against an approved ReferralUpgrade to_tier: 'associate-pro'
  associate_pro_pct: number
  median_days_to_pro: number | null   // from ReferralUpgrade.reviewed_at
  still_guest: number         // registered, never came back, never converted — the actionable number to chase
  influenced: { associate_pro: number; eligible: number }  // already-here registrants (was_existing: true) who went pro after this drive — never summed with acquired
}
```

Backend note: `acquired.*` groups by current `referral_status` for users whose `created_via` is this cohort — **index `created_via`**, every figure filters on it once per dashboard load. `associate_pro` is not just a tier read off the user record; cross-check against an **approved** `ReferralUpgrade` with `to_tier: 'associate-pro'`, since that row carries `reviewed_at`.

### 2.2 Meetings & series (ABO-6–8, 16, 47–52)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/meetings` | Filters: `audience_type`, `session_kind`, `access_type`, `cohort_id`, `is_active`, `q`, `starts_after`, `starts_before`, `page`, `limit` |
| POST | `/admin/meetings` | Create standalone or series. Body includes `name`, `starts_at`, `google_meet_url?`, `audience_type?`, `verification_lead_minutes?`, `duration_minutes?`, `session_kind?`, `access_type?`, `venue?` (required if physical), `city?`, `date_confirmed?`, `audience_mode?: 'tier'\|'cohort'`, `cohort_id?`, `recurrence?: { frequency?: 'none'\|'weekly', count? }` → Meeting (first session). **DC-03** — the unscoped Admin `/meetings` create dialog no longer surfaces `session_kind` / `access_type` to the user; it always sends `access_type: 'online'`. A physical session only ever comes from inside a cohort (the DC-02 schedule, or "+ New session" on the Sessions tab), so `access_type: 'physical'` in practice always carries a `cohort_id`. |
| GET | `/admin/meetings/:id` | MeetingDetail |
| PATCH | `/admin/meetings/:id` | Partial update |
| POST | `/admin/meetings/:id/toggle-active` | `{ is_active }` |
| POST | `/admin/meetings/:id/cancel` | Sets `cancelled_at` |
| GET | `/admin/meetings/:id/verifications` | paged verifications |
| GET | `/admin/meetings/series/:id` | MeetingSeries |
| POST | `/admin/meetings/series/:id/cancel` | Cancel all remaining |

**Rules FE already enforces in mocks:**  
- Online → valid `https://meet.google.com/...` URL, or blank for "link pending" (DC-02) — reminders hold until a link is set  
- Physical → `venue` and `city` required; `date_confirmed` defaults false until ops confirms, and gates QR issuance (ABO-20)  
- Cohort audience → `cohort_id` required when `audience_mode === 'cohort'`

### 2.3 Tests (ABO-17, 66–69) — ✅ shipped PR #65, integrated in FE (2026-09-09)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/academy/cohorts/:id/tests` | paged CohortTest[], `questions` omitted |
| POST | `/admin/academy/cohorts/:id/tests` | title, eligibility_* (required, no `'none'`), opens_at, questions[] (≥1) |
| GET | `/admin/academy/tests/:id` | CohortTest (+ questions, incl. `correct_answer`) |
| PATCH | `/admin/academy/tests/:id` | Metadata only — title/description/opens_at/closes_at/duration_minutes/pass_mark. Eligibility is immutable after create |
| PUT | `/admin/academy/tests/:id/questions` | Full replace, ≥1 question required |
| POST | `/admin/academy/tests/:id/toggle-active` | `{ is_active }` |
| GET | `/admin/academy/tests/:id/attempts` | paged TestAttempt[] |
| GET | `/admin/academy/tests/:id/attempts/export` | Streaming CSV |

### 2.4 Check-in kiosk (ABO-21, 62–65) — moved off Admin (DC-06), ✅ shipped PR #65

The kiosk is **not** an Admin page. `view_academy` gates the page but not the sidebar around it, so any account that could reach the kiosk could reach everything else that permission's role allows — wrong for volunteers running a door on a shared phone. It moves to the Academy site as a public route behind the existing shared PIN (`x-checkin-pin` header), no Abode Admin session. `app/(dashboard)/checkin` and the `Check-in` sidebar item are deleted from this repo; `features/checkin/**` (the 410-line `CheckinKioskPage` — scanner, search fallback, running count, duplicate handling) ports **as built** to the Academy repo, kept exactly as it is.

Shipped path prefix is `academy/checkin/*`, not the `checkin/*` originally sketched below — shapes otherwise match:

| Method | Path (public + PIN, not `/admin/*`) | Notes |
|---|---|---|
| GET | `/academy/checkin/sessions` | Physical, `details_confirmed`, active sessions scheduled today |
| GET | `/academy/checkin/sessions/:id/stats` | `{ checked_in, total, remaining }` |
| GET | `/academy/checkin/sessions/:id/search` | Query `q` → CheckinSearchRow[] (cap 20) |
| POST | `/academy/checkin/sessions/:id/check-in` | `{ registration_id? \| qr_payload? }` → CheckinResult |

Prefer `outcome: 'already'` (200) for duplicates so the kiosk can show prior `checked_in_at` without treating it as a hard error; or 409 with the same body — FE expects 200 + `outcome`.

**What Admin keeps:** the *record*, not the operation. A physical session's attendance list is visible on the session detail page, and `checked_in` stays a column and filter on the cohort's Registrants tab (`GET /admin/academy/cohorts/:id/registrants`, §2.1) — ops reads the numbers in Admin, volunteers do the door on the kiosk.

---

## 3. Public Academy endpoints (today Next `/api/*`; target `/api/v1/...`)

FE Academy currently calls same-origin Next routes. BE should expose equivalent under public API; Academy will point `NEXT_PUBLIC_API_BASE_URL` at `/api/v1`.

| Method | Suggested BE path | Current FE path | Purpose |
|---|---|---|---|
| GET | `/public/academy/cohorts/current?cohort=` | `/api/cohorts/current` | Default / by-slug cohort for register |
| POST | `/academy/programmes/:programmeSlug/register` **(live)** | `/api/register` | Cohort registration — real path, programme in the URL not the body |
| GET | `/public/meetings/:slug` | `/api/meet/[slug]` | Join meta |
| GET | `/public/meetings/series/:slug` | `/api/meet/series/[slug]` | Series resolve → live/upcoming/finished |
| POST | `/public/meetings/:slug/verify` | `/api/meet/verify` | Email gate + record attendance |
| GET | `/public/meetings/:slug/qr?email=` | `/api/session-qr?session=&email=` | Physical QR ready/pending |
| GET | `/public/tests/:slug` | `/api/test/[slug]` | Test meta |
| POST | `/public/tests/:slug/verify` | `/api/test/verify` | Eligibility + questions (no answers) |
| POST | `/public/tests/:slug/save` | `/api/test/save` | Autosave answers |
| POST | `/public/tests/:slug/submit` | `/api/test/submit` | Score + one-attempt |

### 3.1 Register — `POST /academy/programmes/:programmeSlug/register` (live, public, throttled 20/min)

The programme is a path param, not a body field, so a page can't post to the wrong programme. Never asks whether they have an account, their tier, or their Abode email — the server resolves all three.

```ts
// Body (RegisterDto)
{
  cohort_slug?: string          // omitted = the programme default
  first_name: string
  last_name: string
  email: string
  phone: string
  gender?: string
  age_bracket?: string
  status?: string
  employment_status?: string
  organisation?: string
  region?: string
  previous_attendee?: string
  referral_source?: string
  referred_by_username?: string  // stored even when it resolves to nobody
  from_meeting?: string          // session slug, when arriving from a walk-in link
}
```

```ts
// 201 response
{
  registration_id: string
  cohort: { slug: string; label: string }
  person: 'new' | 'returning'
  emails: { confirmation: 'sent'; qr: 'sent' | 'waiting_for_date' | 'none' }
  // 'none' today — QR has no trigger until physical sessions exist (DC-02 Phase 2)
}
```

**Registration never changes an existing person's tier.** A new person is created as `guest`; promotion to `associate` happens only on first login, keyed on `created_via` matching a real cohort slug (see the auth note below). Known error outcomes: `PROGRAMME_NOT_FOUND`, `PROGRAMME_PAUSED` (programme `is_active: false`), `COHORT_NOT_FOUND` (bad `cohort_slug`), `REGISTRATION_CLOSED` (no default cohort, or the resolved cohort's `registration_open: false`), `ALREADY_REGISTERED` (duplicate `(cohort_id, email)`).

**Guest promotion (auth, not academy) — relevant to DC-07's Outcomes:** on first login, a `guest` whose `User.created_via` matches a real cohort slug is promoted to `associate`; a guest with no such provenance (e.g. a migrated legacy account) settles to plain `user`. This is the live mechanism behind DC-07's `acquired` / `still_guest` / promotion-rule numbers — it's already shipped, just not yet exposed through a dashboard aggregate.

### 3.2 Meet verify

**Request:** `{ slug, email, source?: 'existing_registrant' | 'new_registrant' }`  
**Responses:**
- `{ ok: true, redirect_url, registrant_name }` — online → Meet URL; physical → may be register/confirmation path
- `{ ok: false, register_url }` — unknown email on open_recruitment (walk-in)
- `{ ok: false, error, too_early?, verification_opens_at? }`

### 3.3 Series resolve

```ts
{
  status: 'live' | 'upcoming' | 'finished' | 'cancelled' | 'not_found'
  series: { slug, name, is_active, cancelled_at, cohort_label, register_path } | null
  session: PublicMeetSession | null
  join_path: string | null
  message: string
}
```

### 3.4 Session QR

- `pending` if physical && `!details_confirmed`
- `ready` with `registration_id`, `checkin_url`, `qr_data_url` (or BE returns image URL; FE can render)
- `not_physical` / `not_found`

### 3.5 Test verify / submit

Verify statuses (as shipped): `ok` | `inactive` | `not_open` | `closed` | `not_attended` | `already_taken` | `error`  
Submit ok: `{ score, passed, correct_count, total_count, pass_mark }`

### 3.6 Check-in kiosk (DC-06) — ✅ shipped PR #65 as `academy/checkin/*`

Public + PIN, same as every other route in this section — not `/admin/*`. See §2.4 for the endpoint table (note the shipped path prefix is `academy/checkin/*`, not `checkin/*`) and what stays visible in Admin.

---

## 4. Email send (BE ABO-70–73) — ✅ shipped PR #65

See §1.12 for the full DC-05 spec (template shape, keys, QR-as-attachment, per-session reminders).

| Event | Template key | Trigger |
|---|---|---|
| Registration success | `academy-registration-confirmed` | After POST register |
| Session reminder | `academy-session-reminder` | Scheduler, day before + shortly before; per session |
| Physical QR | `academy-checkin-qr` | When `details_confirmed` flips true (or manual resend) |
| Company outing pickup | `academy-outing-pickup` | ON HOLD until ABO-22+ |
| Post-outing review | `academy-outing-review` | ON HOLD; checked-in only |
| Waitlist | `academy-waitlist` | When cohort/event full |

There is no more admin `/email-designs` preview — it added no action for ops and confused the nav. BE owns the templates, the send, and the logging; if a preview is wanted it belongs in BE tooling.

---

## 5. Suggested relational model (minimal)

```
programmes 1──* cohorts 1──* registrants
                   │
                   ├──* tests 1──* test_questions
                   │         1──* test_attempts
                   └──* meetings (via cohort_id)
meetings *──1 series (optional)
meetings 1──* meeting_verifications
registrants 1──* check_ins (per meeting / company_event)
```

Constraints FE assumes:
- Unique `(cohort_id, email)` on registrants  
- One open attempt / one submit per `(test_id, email)`  
- Unique verification per `(meeting_id, email)`  
- Check-in unique per `(meeting_id, registration_id)` unless `force`  
- At most one `is_default` cohort per programme  

---

## 6. Permissions

| Permission | Used for |
|---|---|
| `view_meetings` / `manage_meetings` | Meetings UI |
| `view_academy` / `manage_academy` | Recruitment, QA hub |
| `export_academy` | Registrant CSV |

Check-in and email designs no longer sit behind these Admin permissions — the kiosk is public + PIN on the Academy site (§2.4, DC-06) and the email designs are gone from Admin entirely (§1.12, DC-05).

---

## 7. FE mock mapping (until BE lands)

| Domain | Admin mock file |
|---|---|
| Academy | `lib/mocks/routes/academy.ts` |
| Meetings | `lib/mocks/routes/meetings.ts` (also exports `seedSessionsForCohort` — the DC-02 schedule → sessions builder, called from the academy mock so cohort creation stays one atomic write) |
| Flag | `NEXT_PUBLIC_USE_MOCKS=true` |

Check-in (DC-06) has no admin mock any more — `lib/mocks/routes/checkin.ts` is deleted. It belongs in the Academy repo's mocks once the kiosk moves there.

Academy greenfield: `lib/public-meetings.ts`, `public-cohorts.ts`, `public-tests.ts`, `public-session-qr.ts`.

---

## 8. Explicitly deferred for BE (not in this FE ship)

- Company events CRUD + public register + review (ABO-74–81)  
- Legacy Supabase check-in table coexistence strategy  
- Authz audit / monitoring (ABO-82–86)
- DC-05 email template port (`abode-be-v2/.../email.templates.ts` + scheduler crons)  
- DC-06 check-in kiosk move (Academy repo: public route, PIN auth, `features/checkin/**` port)
