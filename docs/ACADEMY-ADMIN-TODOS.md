# Academy / In-House Recruitment — Frontend TODOs

Version: 1.3  
Date: 2026-09-07  
Status: FE-only. Replaces v1.2 full-backlog dump. Task table = Linear issues **assigned to Immanuel (ABO-5–ABO-28)** only. Backend (ABO-29–86) is **not** implemented here — tracked as dependencies.  
Linear project: [ABODE V2.1](https://linear.app/abode-tech/project/abode-v21-9dfd456ecd75)  
Assignee scope: Immanuel  

---

## 1. Scope Recap

**Your job:** ship the Admin and public frontend for in-house recruitment. Consume `/api/v1` contracts that backend owns. Do **not** implement Nest modules, schemas, queues, or seat-reservation logic.

**Repos**

| App | Your work |
|---|---|
| `Abode-Admin/abode-fe-admin` | Nav, meetings/series, programmes/cohorts, dashboard, registrants, referrals, cohort sessions/tests, check-in kiosk, company events Admin UI, email **designs** |
| `Abode-Academy` (public FE) | Registration, series link, session join, public test, QR delivery UX, company-event registration + review |

**Out of your scope**

- All backend APIs, data model, constraints, lifecycle email **delivery**, authz, audit, monitoring (ABO-29–86)
- Marketing email blasts
- Land Allocation plot picker (Admin `/allocation`) — different product; company-event “allocation day” is outing attendance UX only

**Total scope:** **24 FE tasks (ABO-5–ABO-28)**.

---

## 2. Decision Recap (FE-relevant)

| # | Decision | Implication for FE |
|---|---|---|
| FE-1 | One event system on the platform (BE). | Admin Meetings UI gains cohort/tier audience, online/physical, series — extend existing meetings feature, don’t invent a second meetings app. |
| FE-2 | Programme + cohort first-class. | Admin Recruitment: create programme/cohort → parameterized dashboard/registrants/referrals (no cloned sidebar per cohort). |
| FE-3 | Abode-Academy is the public register FE. | Point register (and join/test/series/company-event) at `NEXT_PUBLIC_API_BASE_URL` `/api/v1`, not Supabase Next routes for new cohorts. |
| FE-4 | Site inspection / allocation days = **company events**. | Admin creates outing (estate, date, pickups, seats). Public **registration form** when the event is open. Check-in kiosk records who went. Not plot allocation. |
| FE-5 | Lifecycle emails = BE delivery. | ABO-27 is **design only**; scheduling/send is BE. |
| FE-6 | You do not implement BE. | Blocked work waits on ABO-29+; mock or disable UI until contracts exist. |

---

## 3. Implementation Plan (FE phases)

### Phase 1 — Shell & meetings Admin
ABO-5 Nav · ABO-6 Meetings list · ABO-7 Meeting form · ABO-8 Series detail.

### Phase 2 — Public meetings
ABO-9 Series link · ABO-10 Session join page.

### Phase 3 — Recruitment Admin
ABO-11 Programmes · ABO-12 Cohorts · ABO-13 Dashboard · ABO-14 Registrants · ABO-15 Referrals · ABO-16 Cohort sessions · ABO-17 Cohort tests.

### Phase 4 — Public Academy
ABO-18 Registration · ABO-19 Test page · ABO-20 QR delivery UX.

### Phase 5 — Check-in & company events
ABO-21 Kiosk · ABO-22 Events list · ABO-23 Event creation · ABO-24 Public event registration · ABO-25 Event management · ABO-26 Event review.

### Phase 6 — Polish
ABO-27 Email designs · ABO-28 FE QA.

---

## 3b. End-to-end (what FE must support)

```text
Admin: create programme + cohort
  → Academy: public register (/api/v1)
  → Admin: dashboard / registrants / referrals
  → Admin: cohort sessions (online/physical) + tests
  → Public: join / series / test / QR
  → Admin: open company event (site inspection | allocation day)
  → Public: fill event registration form (pickup + waitlist)
  → Kiosk: QR / search check-in
  → Public: post-event review (checked-in only)
```

Conversion funnel Admin tab (associates / purchases) is **optional follow-on** and needs BE funnel APIs — not in ABO-5–28.

---

## 4. Full Task Table (your issues only)

| ID | Task | Description | App | BE dependency (do not build) | Priority | Effort |
|---|---|---|---|---|---|---|
| ABO-5 | Update event navigation | Add Meetings, Recruitment, Company Events. Show active series and current default cohort where useful. | Admin | — | P0 | S |
| ABO-6 | Upgrade the meetings list | Standalone + series rows: audience, access type, session kind, series position, date, status, attendance. | Admin | ABO-47 list/detail shape | P0 | M |
| ABO-7 | Upgrade the meeting form | Online or physical; tier or cohort audience; repetition; preview before creating multiple sessions. | Admin | ABO-47, ABO-48 | P0 | L |
| ABO-8 | Build the series detail page | Sessions, shared link, attendance by session, completion, drop-off, cancellation controls. | Admin | ABO-52 | P0 | M |
| ABO-9 | Build the public series link | One shared link → active session, else next upcoming, else finished. | Academy / public | ABO-51 | P0 | M |
| ABO-10 | Upgrade the session join page | Restricted internal, open recruitment, known attendees, walk-ins, link back to cohort registration. | Academy / public | ABO-54–56 | P0 | L |
| ABO-11 | Build programme management | List, create, pause, view programmes and their cohorts. | Admin | ABO-33 | P0 | M |
| ABO-12 | Build cohort management | Create/edit cohort; goal; dates; open/close registration; set programme default. | Admin | ABO-34, ABO-35 | P0 | M |
| ABO-13 | Build the cohort dashboard | Progress, new vs existing users, daily registrations, demographics, regions, referral sources, recent rows. | Admin | ABO-37 | P0 | L |
| ABO-14 | Build cohort registrant management | Search, filters, CSV export, detail, referral info, registration + check-in status, controlled deletion. | Admin | ABO-38 | P0 | M |
| ABO-15 | Build the cohort referral leaderboard | Rank by genuinely new people brought to Abode; show those registrants’ attendance. | Admin | ABO-37, ABO-58 | P0 | M |
| ABO-16 | Build cohort session management | List cohort online/physical sessions; create with cohort audience preselected. | Admin | ABO-47 | P0 | M |
| ABO-17 | Build cohort test management | Create tests/questions; eligibility = session or N-of-M series; review attempts. | Admin | ABO-66–69 | P0 | L |
| ABO-18 | Upgrade the public registration page | Remove account-status questions; default cohort; cohort-specific links; prefill walk-in; duplicate + closed handling. Wire to `/api/v1`. | Academy | ABO-36, ABO-39–44 | P0 | L |
| ABO-19 | Upgrade the public test page | Attendance gate, save progress, submit, results, prevent multiple attempts. | Academy / public | ABO-67, ABO-68 | P0 | M |
| ABO-20 | Add QR delivery to physical sessions | Show/send QR when physical session confirmed; pending state when details not confirmed. | Academy / public | ABO-60 | P0 | S | **FE done (mocked)** |
| ABO-21 | Upgrade the check-in kiosk | QR scan, name search, duplicate warnings, live counts, attendee registration status. | Admin (kiosk) | ABO-62–65 | P0 | L | **FE done (mocked)** |
| ABO-22 | Build the company-events list | **ON HOLD** — Site inspections + allocation days list. | Admin | ABO-74 | P0 | M |
| ABO-23 | Build company-event creation | **ON HOLD** | Admin | ABO-74, ABO-75 | P0 | L |
| ABO-24 | Build company-event registration | **ON HOLD** | Academy / public | ABO-76, ABO-77 | P0 | L |
| ABO-25 | Build company-event management | **ON HOLD** | Admin | ABO-78, ABO-79 | P0 | L |
| ABO-26 | Build the company-event review flow | **ON HOLD** | Academy / public | ABO-80 | P1 | M |
| ABO-27 | Create event email designs | Design registration, reminder, QR, pickup, review, waitlist emails. **Delivery is BE.** | Design / Admin | ABO-70 | P0 | M | **FE done (design preview)** |
| ABO-28 | Complete frontend QA | Registration, online attendance, physical check-in, test, review — desktop + mobile. | Cross FE | Relevant BE slices live | P0 | L | **FE done (QA checklist + hub; company-event review deferred)** |

**Links:** each ID → `https://linear.app/abode-tech/issue/ABO-N/...` (see Linear).

---

## 5. Backend dependencies (not your tasks)

Do not implement these. Track readiness so FE can unblock.

| BE range | Topic | Unblocks FE |
|---|---|---|
| ABO-29–32 | Architecture + model + constraints + attendance shape | Everything |
| ABO-33–46 | Programme/cohort/register APIs, guests, snapshots | ABO-11–15, 18 |
| ABO-47–58 | Meetings, series, walk-ins, attendance reporting | ABO-6–10, 16, 15 |
| ABO-59–65 | QR + kiosk APIs | ABO-20, 21 |
| ABO-66–69 | Test APIs | ABO-17, 19 |
| ABO-70–73 | Lifecycle email **send** | ABO-27 designs only until then |
| ABO-74–81 | Company events + reviews BE | ABO-22–26 |
| ABO-82–86 | Authz, audit, BE tests, monitoring, legacy | Permissions gating, coexistence |

Until a BE endpoint is ready: mock in Admin mocks / Academy API client, or hide the nav item behind a feature flag.

---

## 6. Testing Strategy (FE)

| Guarantee | Covered by |
|---|---|
| Nav exposes Meetings / Recruitment / Company Events without per-cohort sidebar clones | ABO-5, ABO-28 |
| Meeting form preview + list/series detail match BE contracts | ABO-6–8, ABO-28 |
| Public join handles restricted vs open + walk-in → register link | ABO-10, ABO-28 |
| Register: default cohort, closed, duplicate, walk-in prefill | ABO-18, ABO-28 |
| Dashboard/registrants/referrals usable on empty and populated cohort | ABO-13–15, ABO-28 |
| Company-event create → public form → kiosk path works when BE is up | ABO-22–25, ABO-21, ABO-28 |
| Review only for checked-in (when BE enforces) | ABO-26, ABO-28 |
| Desktop + mobile | ABO-28 |

---

## 7. Suggested FE routes (target)

**Admin (`abode-fe-admin`)**

```
/meetings
/meetings/new
/meetings/series/:seriesId
/recruitment                              programmes list
/recruitment/new
/recruitment/:programmeId
/recruitment/:programmeId/cohorts/:cohortId/dashboard
/recruitment/.../registrants
/recruitment/.../referrals
/recruitment/.../sessions
/recruitment/.../tests
/company-events
/company-events/new
/company-events/:id
/checkin                                  kiosk
```

**Public (Abode-Academy / join surfaces)**

```
/register                                 (+ ?cohort=)
/join/:slug
/series/:seriesSlug
/test/:slug
/company-events/:id/register
/company-events/:id/review
```

Exact paths may follow existing Admin conventions; keep one Recruitment entry, not one nav item per cohort.

---

## 8. What changed from v1.2

| v1.2 | v1.3 |
|---|---|
| Task table ABO-5–86 (full backlog) | **ABO-5–28 only** (assigned to you) |
| BE tasks as “do this” | BE listed as **dependencies** only |
| AA-F funnel BE + FE | Funnel Admin tab deferred; not in your Linear set |
| Implied you might own Nest work | Explicit: **no backend implementation** |

---

## 9. Suggested FE build order

1. ABO-5 (nav)  
2. ABO-11 → 12 → 13 → 14 → 15 (recruitment Admin; mock if BE lagging)  
3. ABO-18 (Academy register → REST)  
4. ABO-6 → 7 → 8 → 16 then ABO-9 → 10  
5. ABO-17 → 19  
6. ABO-20 → 21  
7. ABO-22 → 23 → 25 → 24 → 26  
8. ABO-27, ABO-28  

Coordinate with BE on which `/api/v1` slices land first so you aren’t blocked on mocks longer than needed.
