# Academy FE QA results — ABO-28

Date: 2026-09-07  
Mode: **Mock data** (Admin `NEXT_PUBLIC_USE_MOCKS=true`; Academy `lib/public-*` fixtures)

## Completed tasks covered

| ID | Feature | QA method | Result |
|---|---|---|---|
| ABO-5 | Events nav | Code review + routes exist | Pass (shell) |
| ABO-6–8 | Meetings / series | Admin mock dispatcher | Pass |
| ABO-9–10 | Series + join | Academy lib smoke | Pass |
| ABO-11–15 | Programmes / cohorts / dashboard / registrants / referrals | Admin mock dispatcher | Pass |
| ABO-16–17 | Cohort sessions + tests | Admin mock dispatcher | Pass |
| ABO-18 | Register | Academy `mockRegister` | Pass |
| ABO-19 | Public test | Academy fixture + score path | Pass |
| ABO-20 | Session QR ready/pending | Academy `resolveSessionQr` | Pass |
| ABO-21 | Check-in kiosk APIs | Admin mock dispatcher | Pass |
| ABO-27 | Email designs | Page + templates present | Pass (design only) |
| ABO-28 | QA hub / checklist | This doc + scripts | Pass |
| ABO-22–26 | Company events | ON HOLD | Skipped |

## Automated runs

### Admin mocks — `npx tsx scripts/academy-mock-qa.ts`

```
PASS A-programmes
PASS A-programme-detail
PASS A-cohort
PASS A-dashboard
PASS A-registrants
PASS A-referrals
PASS A-tests
PASS A-meetings
PASS A-series
PASS A-checkin-sessions
PASS A-checkin-search
PASS A-checkin-reg1
PASS A-checkin-reg2-dup
Admin mock QA: 13/13 passed
```

### Academy public — `npx tsx scripts/academy-public-qa.ts`

```
PASS P-cohort-default
PASS P-cohort-sep
PASS P-register
PASS P-series
PASS P-physical-session
PASS P-verify-physical
PASS P-qr-ready
PASS P-qr-pending
PASS P-test-fixture
Academy public QA: 9/9 passed
```

## Manual UI checklist (browser)

Use while signed into Admin (mocks) and Academy on its local port:

| Check | URL / action | Status |
|---|---|---|
| Email designs preview | `/email-designs` | ☐ Manual |
| FE QA hub | `/academy-qa` | ☐ Manual |
| Check-in paste `reg_1` | `/checkin` | ☐ Manual |
| Register cohort | `/register?cohort=rcp-september-2026` | ☐ Manual |
| Join physical + QR | `/join/rcp-sep-session-4` + `ada@example.com` | ☐ Manual |
| Pending QR | `/join/rcp-physical-pending-venue` | ☐ Manual |
| Series resolve | `/series/rcp-september-2026-sessions` | ☐ Manual |
| Test | `/test/rcp-sep-2026-final` + `ada@example.com` | ☐ Manual |

## Notes

- Live HTTP page probes during this session hit mixed/stale Next processes on ports 3000/3001 (lock conflicts). Prefer restarting each app cleanly, then run the manual table.
- Backend contract for all of the above: `docs/ACADEMY-BACKEND-CONTRACT.md`
- Mock status: `docs/ACADEMY-MOCK-STATUS.md`
