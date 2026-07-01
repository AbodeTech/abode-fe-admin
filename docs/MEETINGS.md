# Meetings (Admin)

Admin UI for the Meet Gate feature: create shareable Google Meet links, track verified attendance, and view session metrics. Realtors verify their email on abode-fe-v2 before joining.

Full contract for the backend team: [`Abode-Combine/docs/MEETINGS-API-SPEC.md`](../../../Abode-Combine/docs/MEETINGS-API-SPEC.md).

## Routes

| Route | Purpose |
|---|---|
| `/meetings` | List + create meeting links |
| `/meetings/[id]` | Detail: stats, charts, verified attendees (polls every 5s) |
| `/meetings/[id]/edit` | Edit meeting metadata |

Nav item lives under the **Associates** group in the sidebar.

## Feature module

```
features/meetings/
  index.ts
  schemas/meeting.schema.ts       zod validation for create/edit
  lib/
    meet-time.ts                  WAT formatting + verification window
    meet-validation.ts            audience options, Google Meet URL check, slug
  hooks/
    query-keys.ts
    use-meetings.ts               list + detail
    use-meeting-mutations.ts      create, update, toggle active
    use-meeting-stats.ts          stats + paginated verifications
    mock-meetings.ts              in-memory store + seed data
  components/
    MeetingCreateForm.tsx
    MeetingEditForm.tsx
    MeetingsTable.tsx
    MeetingDetailHeader.tsx
    MeetingStatCards.tsx
    MeetingStatsCharts.tsx
    MeetingVerificationsTable.tsx
```

## Audience types

| `audience_type` | Who can verify |
|---|---|
| `all_associates` | associate + associate-pro + agency + founder + premium + management |
| `associate_pro_plus` | associate-pro and above |
| `associate_only` | associate tier only |

## Mock mode (current)

The UI runs on an in-memory mock by default. Set `NEXT_PUBLIC_USE_MOCK_MEETINGS=false` once the backend ships.

**Seed data:**

- `Associate Town Hall — Q2` (active, starts in 2 hours, 3 verifications)
- `Associate Pro Strategy Sync` (active, tomorrow, 0 verifications)
- `Sales Training — Module 3` (inactive, yesterday, 12 verifications)

Share links point at `NEXT_PUBLIC_FE_APP_URL/join/{slug}`. Set `NEXT_PUBLIC_FE_APP_URL` to the abode-fe-v2 domain (locally `http://localhost:3000`).

## Wiring the real backend

1. Add `graphql()` templates to each hook file.
2. Replace the mock branch (`if (USE_MOCK_MEETINGS)`) with `execute(QUERY, vars)`.
3. Run `yarn codegen`.
4. Set `NEXT_PUBLIC_USE_MOCK_MEETINGS=false`.
5. Delete `mock-meetings.ts`.

Component return shapes match the spec, so no component changes are needed.
