# Academy — outstanding backend work

For the `abode-be-v2` team. Everything below was found either by reading the current `academy` and `meetings` module source directly, or reproduced live against `https://api-v2-staging.abodeflex.ng`. Each item says which and when.

Full FE-side field-level contract (request/response shapes, envelope, permissions) lives in `abode-fe-admin/docs/ACADEMY-BACKEND-CONTRACT.md` if useful as a reference while building any of this — you don't need it to understand what's listed here.

**Update (2026-09-10, PR #66):** both remaining items landed — closing §1 and §2 below. `cohort_id`/`access_type` were added to `ListMeetingsQueryDto` (`fee2e97`, 2026-09-09), and `GET /admin/meetings/series/:id` + `POST /admin/meetings/series/:id/cancel` + `POST /admin/meetings/:id/cancel` (single-session terminal cancel) all shipped (`8843241`, 2026-09-10). Nothing outstanding in this doc as of this pull — sections below kept as a record.

**Update (2026-09-09, PR #65):** check-in kiosk, session-reminder emails, and the full Cohort Tests admin CRUD all landed — closing §3, §4, and §5 below.

**Earlier update:** the meetings extension (cohort sessions, physical days, recurrence) and the whole registrants/referrals/dashboard surface landed before that (`admin registrants list/filter/export`, `referral leaderboard`, `cohort dashboard and outcomes`, `meetings extension to create meeting cohort series and verify attendance`, `creating cohort sessions schedule and attendance flow`).

---

## 1. `GET /admin/meetings` query filters are missing `cohort_id` and `access_type` — ✅ RESOLVED 2026-09-09 (`fee2e97`)

**Confirmed live** (`https://api-v2-staging.abodeflex.ng`): both currently 400:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["property access_type should not exist"]
}
```

(same shape for `cohort_id`). Checked `list-meetings-query.dto.ts` directly — it only accepts `page, limit, audience_type, is_active, starts_after, starts_before, q`. `access_type` and `cohort_id` are both real fields on the `Meeting` schema now (and on `CreateMeetingDto`) — they just never made it onto the *list* query DTO.

**Why it matters:** this is the one thing standing between the Academy admin's Sessions tab and real staging. That tab calls `GET /admin/meetings?cohort_id=...` unconditionally just to load a cohort's sessions — right now that 400s on every open. Adding `cohort_id` (and ideally `access_type`, useful but not blocking) to `ListMeetingsQueryDto` is the fix.

**Now also affects:** the new Cohort Tests "create test" dialog (§5) uses the same `cohort_id`-filtered meetings call to populate its session/series eligibility pickers — same 400 on real staging, same fix.

## 2. No series read or cancel endpoints — ✅ RESOLVED 2026-09-10 (`8843241`)

`GET /admin/meetings/series/:id` returns the series (audience, cohort label, access type) plus every session in schedule order with `series_position`/`series_total`, and session/cancelled counts. `POST /admin/meetings/series/:id/cancel` cancels the series and stamps `cancelled_at` on remaining *future* un-cancelled sessions only (past/in-progress sessions keep their attendance), idempotently. A separate `POST /admin/meetings/:id/cancel` also landed for a single session — terminal and irreversible, distinct from the existing reversible `toggle-active`.

**Confirmed via source** — `meetings-admin.controller.ts` has no series routes at all: no `GET /admin/meetings/series/:id`, no cancel for a series, and no `POST /admin/meetings/:id/cancel` for a single session (only `toggle-active` exists, which is reversible — cancel is meant to be terminal, a different thing).

Series membership is tracked (`Meeting.series_id`, `MeetingSeries` schema) and sessions are created correctly as part of a series via `POST /admin/meetings` with `recurrence`. There's just no way to read a series as a unit or cancel its remaining sessions in one call yet. Not urgent — the FE can (and does) treat each session individually via the regular meeting endpoints in the meantime — but worth knowing before ops asks to manage a whole series at once.

## 3. Check-in kiosk — ✅ shipped (PR #65)

Implemented as `academy/checkin/*`, not `/checkin/*` as originally spec'd — path differs from `CHECKIN-KIOSK-MIGRATION.md`, shapes match:

| Method | Path | Auth |
|---|---|---|
| GET | `/academy/checkin/sessions` | `x-checkin-pin` header, no admin JWT |
| GET | `/academy/checkin/sessions/:id/stats` | same |
| GET | `/academy/checkin/sessions/:id/search` | same |
| POST | `/academy/checkin/sessions/:id/check-in` | same |

Per DC-06 the kiosk UI itself belongs to the separate Academy site, not `abode-fe-admin` — no admin-panel change needed here, this section is now just a record that the BE surface exists.

## 4. Email sending — ✅ shipped (PR #65)

`academy-session-reminder` is queued by a new hourly `AcademyRemindersScheduler` cron (`day_before` / `soon` windows, atomic per-session flag so a run only sends once). Fully automated — no admin endpoint, nothing for `abode-fe-admin` to call or manage.

## 5. Tests endpoints — ✅ shipped (PR #65), integrated in `abode-fe-admin`

All eight endpoints landed and are now wired up on the FE (Tests tab: create, edit metadata + replace questions, toggle-active, attempts list + CSV export):

`GET/POST /admin/academy/cohorts/:id/tests`, `GET/PATCH /admin/academy/tests/:id`, `PUT /admin/academy/tests/:id/questions`, `POST /admin/academy/tests/:id/toggle-active`, `GET /admin/academy/tests/:id/attempts`, `GET /admin/academy/tests/:id/attempts/export`.

One contract note for whoever built the original FE mock: `eligibility_type` is required with no "no gate" option on the real BE (`session` or `series_n_of_m` only) — the FE schema had speculatively added a third `'none'` value before this landed; removed to match.

## 6. Test account permissions (housekeeping, not code)

Not a bug — just noting it so it doesn't get lost. The staging account used for QA has neither `manage_academy` nor `manage_meetings`, so write endpoints (create/edit programme, cohort, meeting; toggles; set-default) haven't been exercised live yet — only reads. Also: **staging had zero Academy programmes** the last time this was checked, so there's no real data to drill into either, independent of permissions. Both are on the FE/QA side to resolve, not BE — flagging so it's not chased here by mistake.

---

## Suggested order

Nothing left open as of the 2026-09-10 pull (PR #66) — §1 and §2 both shipped. §6 is FE/QA housekeeping, not a backend item. Kept as a record; reopen a new section here if something regresses or a new gap turns up.
