# Academy Admin Module — Backend Contract (FE → BE)

Version: 1.0  
Date: 2026-09-07  
Status: Derived from **implemented FE** (mocked). Target base path: `/api/v1`.  
Source of truth for FE shapes: Admin Zod schemas + `lib/mocks/routes/{academy,meetings,checkin}.ts` + Academy `lib/public-*.ts`.

**Out of scope here:** Company events ABO-22–26 (ON HOLD). Email **delivery** (ABO-70–73) — designs only in FE.

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
| ABO-21 | Check-in kiosk | Admin | Done (mocked) |
| ABO-27 | Event email designs | Admin | Done (design only — no send API) |
| ABO-28 | FE QA hub + checklist | Cross | Done |

**ON HOLD:** ABO-22–26 company events.

**Envelope (Admin REST):** BE wraps payloads as `{ success, message, data, meta? }`. FE `api-client` unwraps `data` / paged `{ data, meta }`.

**Pagination meta:** `{ total, page, limit, totalPages }`

**Auth:** Admin routes require admin JWT + permissions `view_academy` | `manage_academy` | `export_academy` | `view_meetings` | `manage_meetings` as applicable. Public Academy routes are unauthenticated (rate-limit recommended).

---

## 1. Core data structures

### 1.1 Programme

```ts
{
  id: string
  name: string
  slug: string
  type: 'rcp' | 'academy' | 'masterclass' | 'webinar' | 'custom'
  description: string | null
  is_active: boolean
  cohort_count: number
  latest_cohort: Cohort | null
  cohorts?: Cohort[]
  createdAt: string  // ISO
  updatedAt: string
}
```

### 1.2 Cohort

```ts
{
  id: string
  programme_id: string
  name: string
  slug: string
  label: string
  registration_goal: number
  is_active: boolean
  is_default: boolean
  registration_open: boolean
  event_date: string | null
  event_venue: string | null
  event_city: string | null
  date_confirmed: boolean
  registrant_count: number
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
  details_confirmed?: boolean      // physical: gates QR issuance (ABO-20)
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

```ts
type Eligibility = 'session' | 'series_n_of_m' | 'none'

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
  first_name: string
  last_name: string
  score: number
  passed: boolean
  correct_count: number
  total_count: number
  submitted_at: string
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

### 1.12 Lifecycle email templates (design → BE send)

Kinds (merge fields): `registration` | `reminder` | `qr` | `pickup` | `review` | `waitlist`  
Sample fields: `first_name`, `programme_name`, `cohort_label`, `event_date`, `venue`, `city`, `join_url`, `register_url`, `qr_image_url`, `pickup_point`, `pickup_time`, `review_url`, `waitlist_position`, `support_email`  
FE HTML lives in Admin `features/event-emails/templates.ts`. **Sending is BE only.**

---

## 2. Admin endpoints (`/api/v1`)

### 2.1 Programmes & cohorts (ABO-11–15, 33–38)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/academy/programmes` | Query: `q`, `type`, `is_active`, `page`, `limit` → paged Programme[] |
| POST | `/admin/academy/programmes` | Body: `{ name, type, description?, cohort: { name, registration_goal?, event_date?, event_venue?, event_city?, date_confirmed?, set_as_default? } }` → Programme |
| GET | `/admin/academy/programmes/:id` | Programme (+ cohorts) |
| POST | `/admin/academy/programmes/:id/toggle-active` | `{ is_active }` → Programme |
| POST | `/admin/academy/programmes/:id/cohorts` | CreateCohortInput → Cohort |
| GET | `/admin/academy/cohorts/:id` | Cohort |
| PATCH | `/admin/academy/cohorts/:id` | Partial cohort; setting `is_default: true` clears other defaults on programme |
| GET | `/admin/academy/cohorts/:id/dashboard` | Query: `from`, `to` (YYYY-MM-DD) → dashboard aggregate (see FE mock) |
| GET | `/admin/academy/cohorts/:id/registrants` | Query: `search`, `page`, `limit` → paged Registrant[] |
| GET | `/admin/academy/cohorts/:id/referrals` | paged ReferralRow[] |
| DELETE | `/admin/academy/cohorts/:id/registrants/:registrantId` | Controlled deletion (FE expects; wire when ready) |
| GET | `/admin/academy/cohorts/:id/registrants/export` | CSV (optional SkipTransform stream) |

**Dashboard payload (minimum):**  
`cohort`, `totalAll`, `statesCoveredAll`, `current` / `previous` breakdowns (dailyRegistrations, gender, age, status, region, referral sources, associate vs not), `rangeDays`, `comparison`, `recent_registrants`.

### 2.2 Meetings & series (ABO-6–8, 16, 47–52)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/meetings` | Filters: `audience_type`, `session_kind`, `access_type`, `cohort_id`, `is_active`, `q`, `starts_after`, `starts_before`, `page`, `limit` |
| POST | `/admin/meetings` | Create standalone or series. Body includes `name`, `starts_at`, `google_meet_url?`, `audience_type?`, `verification_lead_minutes?`, `duration_minutes?`, `session_kind?`, `access_type?`, `venue?` (required if physical), `audience_mode?: 'tier'\|'cohort'`, `cohort_id?`, `recurrence?: { frequency?: 'none'\|'weekly', count? }` → Meeting (first session) |
| GET | `/admin/meetings/:id` | MeetingDetail |
| PATCH | `/admin/meetings/:id` | Partial update |
| POST | `/admin/meetings/:id/toggle-active` | `{ is_active }` |
| POST | `/admin/meetings/:id/cancel` | Sets `cancelled_at` |
| GET | `/admin/meetings/:id/verifications` | paged verifications |
| GET | `/admin/meetings/series/:id` | MeetingSeries |
| POST | `/admin/meetings/series/:id/cancel` | Cancel all remaining |

**Rules FE already enforces in mocks:**  
- Online → valid `https://meet.google.com/...` URL  
- Physical → `venue` required; `details_confirmed` should default false until ops confirms  
- Cohort audience → `cohort_id` required when `audience_mode === 'cohort'`

### 2.3 Tests (ABO-17, 66–69)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/academy/cohorts/:id/tests` | paged CohortTest[] |
| POST | `/admin/academy/cohorts/:id/tests` | title, eligibility_*, opens_at, questions[] (≥1) |
| GET | `/admin/academy/tests/:id` | CohortTest (+ questions) |
| POST | `/admin/academy/tests/:id/toggle-active` | `{ is_active }` |
| GET | `/admin/academy/tests/:id/attempts` | paged TestAttempt[] |

### 2.4 Check-in kiosk (ABO-21, 62–65)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/checkin/sessions` | Physical sessions available for kiosk (+ stats) |
| GET | `/admin/checkin/sessions/:id/stats` | `:id` = id or slug → `{ session_id, checked_in, total, remaining }` |
| GET | `/admin/checkin/sessions/:id/search` | Query `q` → CheckinSearchRow[] (cap ~20) |
| POST | `/admin/checkin/sessions/:id/check-in` | `{ registration_id? \| qr_payload?, force? }` → CheckinResult |

Prefer `outcome: 'already'` (200) for duplicates so kiosk can show prior `checked_in_at` without treating as hard error; or 409 with same body — FE today expects 200 + `outcome`.

---

## 3. Public Academy endpoints (today Next `/api/*`; target `/api/v1/...`)

FE Academy currently calls same-origin Next routes. BE should expose equivalent under public API; Academy will point `NEXT_PUBLIC_API_BASE_URL` at `/api/v1`.

| Method | Suggested BE path | Current FE path | Purpose |
|---|---|---|---|
| GET | `/public/academy/cohorts/current?cohort=` | `/api/cohorts/current` | Default / by-slug cohort for register |
| POST | `/public/academy/register` | `/api/register` | Cohort registration |
| GET | `/public/meetings/:slug` | `/api/meet/[slug]` | Join meta |
| GET | `/public/meetings/series/:slug` | `/api/meet/series/[slug]` | Series resolve → live/upcoming/finished |
| POST | `/public/meetings/:slug/verify` | `/api/meet/verify` | Email gate + record attendance |
| GET | `/public/meetings/:slug/qr?email=` | `/api/session-qr?session=&email=` | Physical QR ready/pending |
| GET | `/public/tests/:slug` | `/api/test/[slug]` | Test meta |
| POST | `/public/tests/:slug/verify` | `/api/test/verify` | Eligibility + questions (no answers) |
| POST | `/public/tests/:slug/save` | `/api/test/save` | Autosave answers |
| POST | `/public/tests/:slug/submit` | `/api/test/submit` | Score + one-attempt |

### 3.1 Register body

```ts
{
  first_name, last_name, email, phone, gender, age_bracket,
  status, region, referral_source, referral_name?,
  cohort_slug?, meet_slug?, walk_in?, referred_by_username?
  // ABO-18: do NOT require previous_attendee / associate-pro / AbodeFlex account questions
}
```

**Responses:** `201 { registration_id, cohort_slug }` · `409` duplicate · `403` closed · `404` unknown cohort

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

Verify statuses: `ok` | `inactive` | `not_open` | `closed` | `not_attended` | `already_taken` | `not_registrant` | `error`  
Submit ok: `{ score, passed, correct_count, total_count, pass_mark }`

---

## 4. Email send (BE ABO-70–73) — required for production parity

| Event | Template kind | Trigger |
|---|---|---|
| Registration success | `registration` | After POST register |
| Session reminder | `reminder` | Scheduler N hours before |
| Physical QR | `qr` | When `details_confirmed` flips true (or manual resend) |
| Company outing pickup | `pickup` | ON HOLD until ABO-22+ |
| Post-outing review | `review` | ON HOLD; checked-in only |
| Waitlist | `waitlist` | When cohort/event full |

FE provides HTML designs at Admin `/email-designs`. BE owns send + logging.

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
| `view_academy` / `manage_academy` | Recruitment, check-in, email designs, QA hub |
| `export_academy` | Registrant CSV |

---

## 7. FE mock mapping (until BE lands)

| Domain | Admin mock file |
|---|---|
| Academy | `lib/mocks/routes/academy.ts` |
| Meetings | `lib/mocks/routes/meetings.ts` |
| Check-in | `lib/mocks/routes/checkin.ts` |
| Flag | `NEXT_PUBLIC_USE_MOCKS=true` |

Academy greenfield: `lib/public-meetings.ts`, `public-cohorts.ts`, `public-tests.ts`, `public-session-qr.ts`.

---

## 8. Explicitly deferred for BE (not in this FE ship)

- Company events CRUD + public register + review (ABO-74–81)  
- Legacy Supabase check-in table coexistence strategy  
- Authz audit / monitoring (ABO-82–86)
