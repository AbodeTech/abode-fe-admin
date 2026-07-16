# Manager Dashboard — Onboarding Split (BE ticket)

Adds two new fields to `ManagerDashboardRecruitment` so the FE can show
the Onboarded card as "12 onboarded · 5 fresh · 7 carryover" instead of
one opaque number.

Small ticket, matches the same shape as the other recruitment fields.

## Why

`onboardedInPeriod` today = any roster pro whose `onboardedAt` falls in
period. Doesn't distinguish "recruited and onboarded this period" (real
new-work) from "recruited months ago, finally onboarded now" (spillover).
Managers need to see the split.

## Field additions

Add to `ManagerDashboardRecruitment`
(`src/schema/adminTypeDefs.ts`, same block as `onboardedInPeriod`):

```graphql
type ManagerDashboardRecruitment {
  # …existing fields…
  onboardedInPeriod: Int!             # (unchanged — the total)
  onboardedFreshInPeriod: Int!        # recruited AND onboarded in period
  onboardedCarryoverInPeriod: Int!    # recruited in a prior period, onboarded in this one
}
```

Invariant: `onboardedFreshInPeriod + onboardedCarryoverInPeriod === onboardedInPeriod`.
Worth an assertion or sanity log in dev to guard against drift.

## Compute

The existing loop that builds `onboardedInPeriod` already iterates the
roster and checks `onboardedAt` in period. Extend to also check
`dateRecruited` (or the recruitment date field the BE already uses for
`RecruitedInPeriod`):

```ts
let onboardedFresh = 0;
let onboardedCarryover = 0;
for (const pro of proUsers) {
  if (!pro.onboardedAt) continue;
  const onboardedAt = new Date(pro.onboardedAt).getTime();
  if (onboardedAt < start.getTime() || onboardedAt > end.getTime()) continue;

  const recruitedAt = pro.dateRecruited ? new Date(pro.dateRecruited).getTime() : null;
  const isFresh =
    recruitedAt != null &&
    recruitedAt >= start.getTime() &&
    recruitedAt <= end.getTime();
  if (isFresh) onboardedFresh += 1;
  else onboardedCarryover += 1;
}
```

Reuse the same `start` / `end` the existing computation uses — don't
introduce a second date range.

## Population

- **Single-manager views**: populated normally (this is the interesting
  view for the split).
- **Combined + system views**: populate for symmetry — same total,
  aggregated across managers. Nothing prevents the split at scale.

Unlike the per-pro contributor fields, no reason to zero this on
combined/system views — the fresh-vs-carryover distinction is meaningful
at any aggregation level.

## Acceptance checklist

- [ ] Two new Int fields on schema, both `Int!` (non-null)
- [ ] `fresh + carryover === onboardedInPeriod` for every response
- [ ] Populated on all three dashboard queries (admin single-manager,
      self, combined, system)
- [ ] Existing `onboardedInPeriod` behaviour unchanged

## FE follow-up (after BE ships)

1. Add both fields to the three dashboard query selections.
2. Pass a `breakdown` to the Onboarded `StatCard` with two segments:
   fresh (emerald) + carryover (gray). Uses the existing
   `BreakdownSegment` infrastructure — no new component.
3. Card label stays as "Onboarded This Period", value stays as the total.
