# Meetings (Admin)

Admin UI for the Meet Gate feature. Wired to staging admin GraphQL
([Meet Gate — GraphQL Endpoints](https://docs.google.com/document/d/1aMn-YKtldvuZFQqVW31JOL7wxQ63kJrdor-SU5cU5Fg/edit?tab=t.0)).

## Live schema (introspected from api-staging)

| Operation | Signature |
|---|---|
| `createMeeting` | `(input: CreateMeetingInput!): Meeting!` |
| `updateMeeting` | `(id: ID!, input: UpdateMeetingInput!): Meeting!` |
| `toggleMeetingActive` | `(id: ID!, isActive: Boolean!): Meeting!` |
| `getMeetings` | `(page, limit, filter: MeetingListFilterInput): MeetingListResponse!` |
| `getMeetingById` | `(id: ID!): MeetingDetail!` |
| `getMeetingVerifications` | `(meetingId, page, limit): MeetingVerificationListResponse!` |

`MeetingDetail` includes `stats { total_verifications, by_referral_status { referral_status, count } }`.
There is **no** separate `getMeetingStats` query.

## Routes

| Route | Purpose |
|---|---|
| `/meetings` | List + create |
| `/meetings/[id]` | Detail + stats + live verifications (5s poll) |
| `/meetings/[id]/edit` | Edit metadata |

## Feature module

```
features/meetings/
  types.ts
  hooks/meeting-api.ts            executeRaw ops matching live schema
  hooks/use-meetings.ts
  hooks/use-meeting-mutations.ts
  hooks/use-meeting-stats.ts
  components/...
```

Share links use `NEXT_PUBLIC_FE_APP_URL/join/{slug}`.

## Audience eligibility (§3)

Mirrors BE `MEETING_AUDIENCE_MAP` (`features/meetings/lib/meet-validation.ts`):

| `audience_type` | Eligible `referral_status` |
|---|---|
| `all_associates` | associate, associate-pro, agency, founder, premium, management |
| `associate_pro_plus` | associate-pro, agency, founder, premium |
| `associate_only` | associate |

Same table used by `verifyMeetingEmail` and `getUpcomingMeetings` on the backend.
