# Academy Admin / Academy public — mock data status

**As of 2026-09-07: all ABO-5–21, 27–28 FE work runs on mocks.** Company events ABO-22–26 are ON HOLD (shell only).

## Admin (`abode-fe-admin`)

- Flag: `NEXT_PUBLIC_USE_MOCKS=true` in `.env`
- Transport: `lib/api-client.ts` → `dispatchMockRequest` → `lib/mocks/routes/*`
- Domains used by this project: `academy.ts`, `meetings.ts`, `checkin.ts`, plus existing auth mocks
- Email designs (`/email-designs`): static HTML preview — **does not send mail**

## Academy (`Abode-Academy`)

New public flows use in-repo mocks when slug/cohort matches seed data:

| Feature | Mock source |
|---|---|
| Series resolve | `lib/public-meetings.ts` |
| Join / verify | `lib/meet-verify.ts` mock branch + `public-meetings` |
| Register (Sep cohort) | `lib/public-cohorts.ts` + `/api/register` |
| Public test | `lib/public-tests.ts` |
| Session QR | `lib/public-session-qr.ts` + `/api/session-qr` |

Legacy Supabase paths may still exist for older cohorts; greenfield RCP September demo is mock-first.

## Not mocked / deferred

- Real Zepto/BE email **delivery** (ABO-70+)
- Company-event APIs (ABO-74+)
- Live Nest `/api/v1` until BE slices ship

## Demo seeds

- `ada@example.com` / `chidi@example.com` / `*@abode.ng`
- Cohort `rcp-september-2026`, series `rcp-september-2026-sessions`
- Check-in `reg_1` … `reg_3`
