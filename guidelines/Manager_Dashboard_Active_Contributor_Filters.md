# Manager Dashboard — Active Contributor Filters (BE ticket)

Adds three new `ProRosterGroup` enum values so the associate table under a
manager's dashboard can filter down to pros who actually contributed to
recruitment / promotions / revenue in the selected period.

Complements the existing `activeRecruitingProsCount` / `activePromotingProsCount`
/ `activeSellingProsCount` counters — same definitions, exposed as filters.

## Why

Today the "Contributing Pros" card on the manager dashboard says e.g.
"5 of your 20 pros recruited someone this period." But there's no way to
see WHO those 5 pros are — the table below only supports whole-roster
groups (Recruited in Period, Onboarded, etc.), and none of them match
"pros who caused any recruits."

## Enum additions

Add to `ProRosterGroup` (`src/schema/adminTypeDefs.ts` — same file as the
current enum):

```graphql
enum ProRosterGroup {
  # …existing values…
  ACTIVE_RECRUITER              # ≥1 qualifying signup CAUSED by this pro in period
  ACTIVE_PROMOTER               # ≥1 approved promotion CAUSED by this pro in period
  ACTIVE_REVENUE_GENERATOR      # >0 total revenue (initial + recurring) in period
}
```

## Filter semantics (matches the existing "activeXProsCount" definitions)

Reuse the same source-of-truth queries the counters already use — no new
aggregations, just re-scope the roster list. Filter logic lives in the
same place as the other `proGroup` branches
(`src/services/admin/manager/dashboardService.ts` / associated helpers).

**`ACTIVE_RECRUITER`** — roster ∩ pros whose id appears as a key in
`qualifyingSignupCountByPro` (the map already built for
`newSignupsInPeriod` at [dashboardService.ts:506-511](../abode-BE/src/services/admin/manager/dashboardService.ts#L506-L511)).
Distinct pros only, no re-count.

**`ACTIVE_PROMOTER`** — roster ∩ pros returned by the upgrade aggregation
at [attribution.ts:238-250](../abode-BE/src/services/admin/manager/attribution.ts#L238-L250):

```ts
referralUpgradeModel.aggregate([
  { $match: {
      associate: { $in: proObjectIds },
      admin_status: "approved",
      user_upgrade_type: { $in: PRO_UPGRADE_TYPES },
      createdAt: { $gte: start, $lte: end },
  } },
  { $group: { _id: "$associate" } },
])
```

Same distinct-pro list.

**`ACTIVE_REVENUE_GENERATOR`** — roster ∩ pros where
`perProPeriodRevenue.amount > 0` (already computed at
[dashboardService.ts:600](../abode-BE/src/services/admin/manager/dashboardService.ts#L600)).

## Distinction vs `SELLING_IN_PERIOD` — worth surfacing

`SELLING_IN_PERIOD` (existing) = pros with `periodInitialCount > 0` —
made at least one **new (initial)** sale in period.

`ACTIVE_REVENUE_GENERATOR` (new) = pros with `periodTotalRevenue > 0` —
made money in period, including recurring revenue from prior sales.

A pro who closed no new sales this period but has recurring flows from
Q1 sales is `ACTIVE_REVENUE_GENERATOR` but NOT `SELLING_IN_PERIOD`. Both
are legitimate, distinct views.

**Note**: the current `activeSellingProsCount` counter is calculated
from `perProPeriodRevenue` (total revenue, not initial), so its name is
slightly misleading — it counts revenue generators, not sellers. Consider
renaming to `activeRevenueGeneratingProsCount` for consistency with the
new enum value. If renamed, the FE swaps in the new name and I ship the
rename in the same PR.

## Sort options

Reuse existing `ProRosterSort` values where they make sense:

- `ACTIVE_RECRUITER` → default `DATE_RECRUITED_DESC` fine. Nice-to-have:
  new `ACTIVE_RECRUITS_DESC` (sort by that pro's recruit count in period).
- `ACTIVE_PROMOTER` → default fine. Nice-to-have: `ACTIVE_PROMOTIONS_DESC`.
- `ACTIVE_REVENUE_GENERATOR` → default to `REVENUE_DESC` (already exists).

Nice-to-haves are optional — not blocking the filter itself.

## Scope

- Single-manager views only (admin + self). Same population rule as the
  existing per-pro contributor lists — combined + system views don't have
  a single "roster" to intersect against.
- On combined/system views, the enum values are accepted but return an
  empty list (mirroring how `topNewSignupsContributors` is empty there).

## Acceptance checklist

- [ ] Enum values added to schema
- [ ] `proGroup` handler in dashboard resolver returns roster filtered by
      the three new rules
- [ ] Group total (`associateProsGroupTotal`) matches the count on the FE
      "Contributing Pros" card exactly (`activeRecruitingProsCount`,
      `activePromotingProsCount`, `activeSellingProsCount` respectively)
- [ ] Sort by existing `REVENUE_DESC` works on `ACTIVE_REVENUE_GENERATOR`
- [ ] Combined + system views return empty for these enum values
      (no accidental cross-roster leaks)
- [ ] (Optional) Rename `activeSellingProsCount` →
      `activeRevenueGeneratingProsCount` for consistency

## FE follow-up (after BE ships)

1. Add three entries to `PRO_GROUP_OPTIONS` in
   [features/associate-managers/lib/roster-filter-options.ts](../features/associate-managers/lib/roster-filter-options.ts).
2. Add labels + descriptions to `GROUP_LABELS` in
   [features/associate-managers/lib/roster-group-labels.ts](../features/associate-managers/lib/roster-group-labels.ts).
3. (Optional) Consider dropping the "Contributing Pros" card once the
   filter ships — the filter reveals the same info with drill-in, so the
   card becomes redundant.
