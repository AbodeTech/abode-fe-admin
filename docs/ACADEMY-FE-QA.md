# Academy FE QA — ABO-28

Version: 1.0  
Date: 2026-09-07  
Scope: FE smoke QA against **mocks** (Admin `NEXT_PUBLIC_USE_MOCKS=true`; Academy in-repo mock libs / API routes). Company-event flows (ABO-22–26) are ON HOLD and excluded.

## Mock confirmation

| Surface | Data source today |
|---|---|
| Admin recruitment, meetings, series, tests, check-in | `lib/mocks/routes/*` via `NEXT_PUBLIC_USE_MOCKS=true` |
| Academy register / join / series / test / session QR | `lib/public-*.ts` + Next `/api/*` mock branches |
| Email designs (ABO-27) | Static HTML preview — **no send** |
| Company events | Shell only / ON HOLD |

When BE `/api/v1` slices land, flip Admin mocks off and replace Academy mock branches — no product redesign expected.

## Demo credentials / seeds

- Emails: `ada@example.com`, `chidi@example.com`, `*@abode.ng`
- Cohort: `rcp-september-2026` / `cohort_sep_2026`
- Series: `rcp-september-2026-sessions`
- Physical join (QR ready): `/join/rcp-sep-session-4`
- Physical join (QR pending): `/join/rcp-physical-pending-venue`
- Test: `/test/rcp-sep-2026-final`
- Check-in ids: `reg_1`, `reg_2` (already in), `reg_3`

---

## Checklist

### Admin — desktop

| # | Flow | Pass? | Notes |
|---|---|---|---|
| A1 | Events nav: Meetings, Recruitment, Check-in, Email designs, Company Events | ☐ | ABO-5 |
| A2 | Meetings list shows series + physical/online | ☐ | ABO-6 |
| A3 | Create meeting form (online + physical fields) | ☐ | ABO-7 |
| A4 | Series detail page loads | ☐ | ABO-8 |
| A5 | Programmes list → programme → cohort shell | ☐ | ABO-11–12 |
| A6 | Cohort dashboard stats render | ☐ | ABO-13 |
| A7 | Registrants search / filters | ☐ | ABO-14 |
| A8 | Referral leaderboard | ☐ | ABO-15 |
| A9 | Cohort Sessions tab | ☐ | ABO-16 |
| A10 | Cohort Tests create / attempts | ☐ | ABO-17 |
| A11 | Check-in: paste `reg_1`, duplicate on `reg_2`, search “Ada” | ☐ | ABO-21 |
| A12 | Email designs: all 6 templates preview | ☐ | ABO-27 |

### Admin — mobile (~390px)

| # | Flow | Pass? | Notes |
|---|---|---|---|
| M1 | Sidebar / nav usable | ☐ | |
| M2 | Recruitment tables scroll horizontally | ☐ | |
| M3 | Check-in scan + search usable on phone | ☐ | Camera may be unavailable → paste/search OK |
| M4 | Email design preview readable | ☐ | |

### Academy — desktop

| # | Flow | Pass? | Notes |
|---|---|---|---|
| P1 | `/register?cohort=rcp-september-2026` | ☐ | ABO-18 |
| P2 | Duplicate email → 409 messaging | ☐ | |
| P3 | `/series/rcp-september-2026-sessions` resolves | ☐ | ABO-9 |
| P4 | Restricted join vs open recruitment | ☐ | ABO-10 |
| P5 | Physical verify → QR ready | ☐ | ABO-20 |
| P6 | Physical pending venue → pending QR | ☐ | ABO-20 |
| P7 | `/test/rcp-sep-2026-final` attendance gate + submit | ☐ | ABO-19 |

### Academy — mobile (~390px)

| # | Flow | Pass? | Notes |
|---|---|---|---|
| PM1 | Register form single-column | ☐ | |
| PM2 | Join verify card fits viewport | ☐ | |
| PM3 | QR image readable | ☐ | |
| PM4 | Test taking usable | ☐ | |

### Explicitly deferred (not failing ABO-28)

- Company event create / public register / review (ABO-22–26 ON HOLD)
- Real email delivery (BE ABO-70+)
- Live BE contract parity (tracked separately when APIs ship)

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| FE | | | Mock QA baseline documented — run checkboxes before BE cutover |
