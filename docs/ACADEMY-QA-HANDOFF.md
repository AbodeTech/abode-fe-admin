# Academy — QA status & BE handoff

Snapshot as of **2026-09-09**, verified directly against `abode-be-v2` staging (`feature/academy-admin-module`, merged at `202ead2`) — not assumed from the contract doc. Two lists: what you can QA against the real backend today, and what's still missing to hand to the BE team.

Full field-level detail lives in `docs/ACADEMY-BACKEND-CONTRACT.md` (v2.1). This file is the checklist version — for **sharing with the BE team directly**, send `docs/ACADEMY-BACKEND-GAPS.md` instead, which is just the gaps section below, cleaned up to stand alone.

---

## Update — PR #65 pulled: check-in kiosk, email reminders, Cohort Tests all landed

A third pull (staging merge commit `534e98b3`, PR #65 "feature/academy-admin-module") brought three more pieces: the check-in kiosk module (`academy/checkin/*`, public/PIN-guarded — DC-06), an hourly `AcademyRemindersScheduler` cron that fully automates session-reminder emails (DC-05), and a brand-new Cohort Tests feature (quizzes gated on session/series attendance) that wasn't in any prior design doc. Read every changed controller/DTO/schema/service directly, then fully integrated the Tests piece into the FE (schemas, hooks for all 8 endpoints, a Tests tab with create/edit/toggle-active/attempts+CSV export) — verified with a mock-mode UI pass (create → edit metadata+questions → review attempts → export CSV → toggle-active; zero `/api/v1` errors, `tsc`/`eslint` clean).

The check-in kiosk and email reminders need **no FE-admin work** — kiosk belongs to the separate Academy site per DC-06's scope, and reminders are a backend-only cron with no admin endpoint. Both are now closed in `ACADEMY-BACKEND-GAPS.md`.

**One contract correction:** `eligibility_type` on a Cohort Test is required with no "no gate" option on the real BE (`session` | `series_n_of_m` only) — the FE schema had a speculative third `'none'` value from before this landed; removed to match.

**Still open, unchanged by this pull:** `GET /admin/meetings` query filters (`cohort_id`/`access_type`) and series read/cancel — see `ACADEMY-BACKEND-GAPS.md` §1–§2. §1 now also blocks the Tests tab's create-dialog eligibility pickers (same `cohort_id`-filtered meetings call the Sessions tab already hits).

---

## Update — `feature/academy-admin-module` pulled again, registrants/referrals/dashboard/meetings landed

A second pull brought five commits: `admin registrants list/filter/export`, `referral leaderboard`, `cohort dashboard and outcomes`, `meetings extension to create meeting cohort series and verify attendance`, `creating cohort sessions schedule and attendance flow`. Read every changed controller/DTO/schema/service directly (not assumed), then **fully integrated all of it into the FE** — schemas, hooks, UI, and the mock — and verified with a full mock-mode UI pass (login → dashboard → registrants filters/export → referrals → sessions → create a physical session → global meetings list; zero `/api/v1` errors, `tsc`/`eslint` clean).

**Real, load-bearing field-name changes this pull made, now matched exactly in the FE:**
- Physical session's confirmation flag is `details_confirmed`, not `date_confirmed` (renamed everywhere: schema, mock, `ScheduleBuilder`, `MeetingFormDialog`).
- `session_kind` (general/recruitment/training) **never existed on the real BE at all** — removed everywhere (type, UI select, table column, filter). `audience_mode` + `cohort_id` already distinguish a cohort session from a tier one, so it was never needed.
- `CreateCohortInput.schedule` is real now (`CohortScheduleDto`) — `online` is a fully optional object (previously the FE always sent an `online` key even at 0 days), `online.days` must be ≥ 1 when `online` is sent, plus new real fields `verification_lead_minutes` and `frequency: 'daily' | 'weekdays' | 'weekly'`.
- `Meeting.google_meet_url` and `Meeting.audience_type` are both nullable on the real BE (link-pending / cohort-mode) — FE schema updated to match; previously these were declared required and would have failed Zod parsing against real data.
- Recurrence widened from weekly-only to `'daily' | 'weekdays' | 'weekly'` (real BE also has `'none'`/`'custom'`, not built in this UI).

**Important scope note — this is source-verified and mock-verified, not yet real-staging-verified.** Real staging still had zero programmes and the test account still lacked `manage_academy` as of the last live pass (see the run below), so none of registrants/referrals/dashboard/the new meetings fields have been exercised against real staging data yet — only against the FE's own mock (which now mirrors the real serializers/services field-for-field) and against the DTOs/services read directly from source. Treat the tables below accordingly: promoted out of "waiting on backend" because the endpoints now **exist and match spec**, not because they've been proven live.

**Still an open gap, unchanged by this pull:** `GET /admin/meetings`'s query DTO still doesn't accept `cohort_id` or `access_type` — confirmed by reading `list-meetings-query.dto.ts` again, it wasn't touched. The Sessions tab still can't filter to just one cohort's sessions server-side; it keeps sending `cohort_id` anyway (see `query-keys.ts`) so it fails loudly rather than silently showing every meeting in the system. Also still missing: any series-detail or cancel endpoint (`GET /admin/meetings/series/:id`, both cancel routes) — no series controller exists at all; those three FE hooks remain mock-only.

---

## Results from the live QA run (2026-09-09)

Driven through the real Admin UI against `https://api-v2-staging.abodeflex.ng/api/v1` (`NEXT_PUBLIC_USE_MOCKS=false`), capturing every network response. Two things surfaced immediately that shaped what could actually be tested:

- **The test account has neither `manage_academy` nor `manage_meetings`.** Every write action (create/edit programme or cohort, toggle-active, toggle-registration, set-default, create/edit meeting) is untested — the UI itself blocks on a permission gate before the request is even sent ("You need manage_academy to create programmes."). **Grant those two permissions to a staging account to unblock write-side QA.**
- **Staging currently has zero Academy programmes** (`GET /admin/academy/programmes` → `{ total: 0 }`). Programme/cohort detail, dashboard, registrants, referrals, sessions and settings tabs couldn't be exercised against real data for the same reason — nothing exists to drill into yet. This is separate from the write-permission gap: even read-only drill-down needs at least one seeded programme+cohort.

### Confirmed working (read-only, this run)

| Call | Result |
|---|---|
| `POST /auth/admin/login` | 200 — real login flow works cleanly (the earlier login failure in this project was a **mock-only** schema issue, unrelated to the real BE) |
| `GET /admin/academy/programmes` (no filters) | 200, correctly empty |
| `GET /admin/academy/programmes?q=...` | 200 — `q` reaches the BE correctly |
| `GET /admin/meetings` (no filters) | 200 |
| `GET /admin/meetings?audience_type=all_associates` | 200 — works |
| `GET /admin/meetings?is_active=true` | 200 — works |
| `GET /admin/meetings?q=...` | 200 — accepted (see note below) |
| `POST /academy/programmes/:slug/register` with a bogus slug | 404 `PROGRAMME_NOT_FOUND` — exactly as documented |

### Confirmed broken (read-only, this run) — both independently reproduced live, not just read from source

| Call | Result |
|---|---|
| `GET /admin/meetings?...&session_kind=general` | **400** `"property session_kind should not exist"` |
| `GET /admin/meetings?...&access_type=online` | **400** `"property access_type should not exist"` |

Matches the meetings-module gap already in this doc below — these two filters need `forbidNonWhitelisted`-safe support (or the FE needs to stop sending them) before the Meetings list or the cohort Sessions tab can be pointed at real staging. **The Sessions tab sends `cohort_id` unconditionally on every load — same failure mode, untested directly only because there's no cohort yet to load one for.**

### One FE-side (not BE) gap found while testing

`ProgrammesListPage.tsx` has **no UI wiring for `is_active` at all** — no filter control, and the URL param isn't read. The `is_active` filter on `GET /admin/academy/programmes` works fine BE-side; there's just nothing on this page that calls it yet. Not a BE issue — noting it so it doesn't get chased on that side.

### Inconclusive — needs a manual spot-check, not a BE issue

The meetings search box: automated rapid typing against the live (non-mock) server only reliably captured a single-character `q=m` request rather than the full typed string — almost certainly a Playwright-vs-live-network timing artifact (the 500ms debounce is fine, unrelated), not a real bug. The request that did land returned 200 with no error. Worth a 10-second manual check, but not worth reporting to BE.

---

## ✅ Live on staging — QA these now

All under `/api/v1`, admin routes gated by `manage_academy` (writes) / `view_academy` (reads), envelope `{ success, message, data, meta? }`.

### Programmes

| # | Method | Path | What to verify |
|---|---|---|---|
| 1 | GET | `/admin/academy/programmes` | `q` search on name/slug, `is_active` filter, pagination meta correct |
| 2 | POST | `/admin/academy/programmes` | Creates programme + first cohort together. Duplicate name → `409 PROGRAMME_NAME_TAKEN`. Missing `name`/`cohort.name` → `400`. First cohort's `is_default` ends up `true` even if `set_as_default` omitted (defaults true). Response's `default_cohort` and `cohorts[0]` should be the same cohort. |
| 3 | GET | `/admin/academy/programmes/:id` | Includes `cohorts[]`. Unknown id → `404 PROGRAMME_NOT_FOUND` |
| 4 | PATCH | `/admin/academy/programmes/:id` | Rename to a name already taken by another programme → `409`. Renaming to its own current name should **not** false-positive as taken. Partial body (just `description`) leaves `name` untouched |
| 5 | POST | `/admin/academy/programmes/:id/toggle-active` | Flips `is_active`. **No FE UI wired to this yet** — call it directly (Postman/Swagger) |
| 6 | POST | `/admin/academy/programmes/:id/cohorts` | New cohort defaults `registration_open: false` regardless of input — confirm there is **no way to open it at creation**, only via #9 afterward. `set_as_default: true` should atomically clear the previous default |

### Cohorts

| # | Method | Path | What to verify |
|---|---|---|---|
| 7 | GET | `/admin/academy/cohorts/:id` | No `is_active` field in the response (that's Programme-only) |
| 8 | PATCH | `/admin/academy/cohorts/:id` | Only `name`, `label`, `registration_goal`, `registration_opens`, `registration_closes`. **Confirm sending `registration_open` or `is_default` in this body is silently ignored** — that's the thing most likely to regress by accident |
| 9 | POST | `/admin/academy/cohorts/:id/toggle-registration` | Body `{ registration_open: boolean }`. This is the **only** way to open/close a cohort post-creation |
| 10 | POST | `/admin/academy/cohorts/:id/set-default` | No body. Confirm it's **atomic** — the previous default cohort on the same programme flips to `false` in the same response cycle, never a moment with two defaults or zero defaults |

### Public

| # | Method | Path | What to verify |
|---|---|---|---|
| 11 | POST | `/academy/programmes/:programmeSlug/register` | Programme slug in the **URL**, not body. Omit `cohort_slug` → lands on the programme's default cohort. Duplicate `(cohort, email)` → `409 ALREADY_REGISTERED`. Closed cohort → `403 REGISTRATION_CLOSED`. Paused programme (`is_active: false`) → `403 PROGRAMME_PAUSED`. Response `emails.qr` should read `'none'` (no physical sessions exist yet to trigger it) |

### Bonus — not a REST call, but worth a manual QA pass

**Guest → associate promotion on first login.** Register a brand-new person (→ `guest`), then log them in for the first time and confirm their tier flips to `associate`. This is the live mechanism behind DC-07's Outcomes numbers (`acquired`, `still_guest`), even though there's no dashboard endpoint to see it yet — check the tier directly on the user record.

---

## ✅ Also live now (integrated this pass — needs a real-staging pass, not yet run)

Confirmed to exist and match spec by reading `academy-admin.controller.ts`, `academy-dashboard.service.ts`, `academy.serializers.ts`, `registrant.dto.ts`, and the meetings module's updated DTOs/schemas directly, then fully wired into the FE and verified against the mock. **Not yet exercised against real staging** — do that next.

| # | Method | Path | What to verify |
|---|---|---|---|
| 12 | GET | `/admin/academy/cohorts/:id/dashboard` | `cohort` in the response is minimal (`id`/`label`/`registration_goal` only — not the full cohort). `checked_in` is `null` until the cohort has a physical session, then `{count, rate}`. `outcomes.acquired` sums to `acquired.total`; `influenced` is never summed with `acquired`. `from`/`to` must be given together or neither (half a range → `400`) |
| 13 | GET | `/admin/academy/cohorts/:id/registrants` | Filters: `search` (name/email/phone), `region`, `was_existing`, `checked_in` — confirm each narrows correctly and combines with the others (AND, not OR) |
| 14 | GET | `/admin/academy/cohorts/:id/registrants/export` | Streaming CSV, UTF-8 BOM, same filters as #13 apply to the export too |
| 15 | PATCH | `/admin/academy/cohorts/:id/registrants/:registrantId` | Only the allowlisted fields — confirm `email`, `was_existing`, `user_id`, `cohort_id` in the body are rejected (`forbidNonWhitelisted`). Toggling `checked_in: true` stamps `checked_in_at`; `false` clears it to `null` |
| 16 | DELETE | `/admin/academy/cohorts/:id/registrants/:registrantId` | `reason` required, `400` without it. Soft delete — confirm the registrant disappears from #13's list but the delete is reversible on the BE side (not from the Admin UI) |
| 17 | GET | `/admin/academy/cohorts/:id/referrals` | Ranked by `new_count` desc, ties → `total_referred` desc, ties → username asc |
| 18 | GET | `/admin/academy/cohorts/:id/referrals/export` | CSV of the full leaderboard |
| 19 | POST | `/admin/meetings` with `access_type: 'physical'` | No `google_meet_url` needed; `venue`+`city` required; `details_confirmed` gates the QR email downstream |
| 20 | POST | `/admin/meetings` with `audience_mode: 'cohort'` | `cohort_id` required, `audience_type` comes back `null` on the created meeting |
| 21 | POST | `/admin/meetings` with `recurrence: { frequency: 'daily', count: N }` | Creates a series of N sessions; also try `weekdays` (should skip Sat/Sun) |
| 22 | POST | `/admin/academy/programmes/:id/cohorts` with `schedule` | The one that matters most: confirm cohort + every session the schedule implies land in **one call**, never a cohort with half its sessions |

### Cohort Tests (new in PR #65, integrated this pass — needs a real-staging pass)

| # | Method | Path | What to verify |
|---|---|---|---|
| 23 | GET/POST | `/admin/academy/cohorts/:id/tests` | List omits `questions` (list view doesn't need the answer key); create requires `eligibility_type` (`session` or `series_n_of_m` — no "no gate" option) and at least one question |
| 24 | GET/PATCH | `/admin/academy/tests/:id` | Detail includes `questions` with `correct_answer` (admin-only view). PATCH is metadata-only — eligibility is fixed at creation, confirm sending it in the body has no effect |
| 25 | PUT | `/admin/academy/tests/:id/questions` | Full replace, `400` on an empty array |
| 26 | POST | `/admin/academy/tests/:id/toggle-active` | Flips `is_active` |
| 27 | GET | `/admin/academy/tests/:id/attempts` | `score`/`passed`/`correct_count`/`total_count`/`submitted_at` are all `null` until submitted — an attempt row can exist from a saved draft before submission |
| 28 | GET | `/admin/academy/tests/:id/attempts/export` | Streaming CSV, same 9 columns as the registrants/referrals exports' pattern |

### Still waiting on backend

- **`GET /admin/meetings` query filters** — still only `page, limit, audience_type, is_active, starts_after, starts_before, q`. No `cohort_id` (blocks the Sessions tab, and now the Tests tab's eligibility pickers, from scoping to just its cohort) or `access_type`. Unchanged by PR #65.
- **Series read/cancel** — no `GET /admin/meetings/series/:id`, no cancel endpoint for a series or a single session (only `toggle-active` exists). No series controller at all.

### Tests endpoints (§5) — ✅ shipped in PR #65, integrated in the FE

All 8 endpoints landed and are wired up (Tests tab: create, edit metadata + replace questions, toggle-active, attempts list + CSV export). See row #23 below.

### Check-in kiosk (DC-06) — ✅ shipped in PR #65 as `academy/checkin/*`

No FE-admin change needed — belongs to the separate Academy site per DC-06's scope. See `ACADEMY-BACKEND-GAPS.md` §3 for the (slightly different-than-spec'd) path.

### Email sending (DC-05) — ✅ shipped in PR #65

`academy-session-reminder` is now sent automatically by an hourly `AcademyRemindersScheduler` cron. No admin endpoint, no FE-admin change needed.

---

## Suggested order for the BE team

1. ~~Meetings module extension~~ — **done** (access_type/venue/city/details_confirmed/cohort_id/audience_mode/recurrence all landed).
2. ~~Academy dashboard endpoint~~ — **done**.
3. ~~Registrants/Referrals~~ — **done**.
4. ~~Check-in kiosk, email reminders, Cohort Tests~~ — **done** (PR #65).
5. **`GET /admin/meetings` query filters** (`cohort_id`, `access_type`) — now the only blocker: it's what's stopping the Sessions tab and the Tests tab's eligibility pickers from working against real staging.
6. Series read/cancel endpoints — needed once ops wants to manage a series as a unit rather than session-by-session.
