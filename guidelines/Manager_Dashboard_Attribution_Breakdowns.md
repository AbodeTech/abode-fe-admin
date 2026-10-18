# Manager Dashboard — Attribution Breakdowns

BE spec. Adds two overlapping attribution features to the existing manager dashboard endpoints — no new pages, no new routes. Every headline number (recruits, promotions, sales, revenue) gains a breakdown answering **where it came from**.

**Repo:** `/Users/user/projects/work/abode/abode-BE` — all file paths below are from that root.

---

## 1. The two questions we're answering

### 1a. Org-wide "where is our growth coming from?" (super admin)

On the combined "All managers" view (`getAllManagersDashboard`) and the system-associates view (`getSystemAssociatesDashboard`), the boss needs to see whether the manager infrastructure is driving growth or whether it's happening organically outside it.

For every count/revenue metric, split by **source** — who the recruiter/seller was:

- **Managed** — recruiter is an associate-pro assigned to a manager (the value the manager system creates)
- **Unassigned** — recruiter is an associate-pro NOT assigned to any manager (opportunity — could be picked up)
- **Users** — recruiter is a regular user
- **Associate** — recruiter is an associate-tier user (not yet a pro)

### 1b. Per-manager "who on my team is driving this?" (individual manager view)

On `adminGetManagerDashboard(managerId, …)` and `managerDashboard()` (self), when a super admin is going through managers one at a time, they need to see which pros on the roster are the top contributors — without hunting through the roster table.

For every count/revenue metric, return the **top N contributors** on that manager's roster:

- `[{ proId, firstName, lastName, count }]` — top ~6, sorted desc
- `otherCount` — remainder summed across the rest of the roster

Both features share the FE surface: one small stacked bar + legend under each KPI card, using the same `StatCard.breakdown` component primitive. The BE feeds different data depending on the view.

---

## 2. Schema additions

### 2.1 New types

Add to `src/schema/adminTypeDefs.ts` alongside the existing `ManagerDashboard*` types (around line 3480).

```graphql
"Aggregation grouped by the referrer's role/assignment status."
type SourceBreakdown {
  managed: Int!
  unassigned: Int!
  users: Int!
  associate: Int!
}

"Float variant for revenue splits (naira)."
type SourceBreakdownFloat {
  managed: Float!
  unassigned: Float!
  users: Float!
  associate: Float!
}

"A single pro's contribution to a per-manager metric."
type ProContributor {
  proId: ID!
  firstName: String
  lastName: String
  email: String
  count: Int!
}

"Float variant for revenue-based contribution lists."
type ProContributorFloat {
  proId: ID!
  firstName: String
  lastName: String
  email: String
  amount: Float!
}
```

### 2.2 Extend `ManagerDashboardRecruitment`

```graphql
type ManagerDashboardRecruitment {
  # existing
  newSignupsInPeriod: Int!
  upgradesInPeriod: Int!
  onboardedInPeriod: Int!
  onboardingQueueCount: Int!
  totalAssigned: Int!

  # NEW — source attribution (populated for combined/system views only)
  newSignupsBySource: SourceBreakdown!
  upgradesBySource: SourceBreakdown!

  # NEW — per-pro attribution (populated for single-manager views only)
  topNewSignupsContributors: [ProContributor!]!
  topUpgradesContributors: [ProContributor!]!
  othersNewSignupsCount: Int!
  othersUpgradesCount: Int!
}
```

**Population rules:**

- **Single-manager view** (`adminGetManagerDashboard`, `managerDashboard`) — populate `top*Contributors` + `others*Count`; return `newSignupsBySource`/`upgradesBySource` as **all zeros** (irrelevant when scoped to one manager's roster).
- **All-managers view** (`getAllManagersDashboard`) — populate `*BySource`; return `top*Contributors` as **empty arrays** and `others*Count` as **zero** (there's no single "team" for the top-N ranking to make sense).
- **System associates view** (`getSystemAssociatesDashboard`) — populate `*BySource`; empty contributors + zero others.

Documenting this null-vs-empty split explicitly so the FE can trust one field per view.

### 2.3 Extend `ManagerDashboardSalesRevenue`

```graphql
type ManagerDashboardSalesRevenue {
  # existing
  sellingPros: Int!
  sellingProsTarget: Int!
  totalRevenue: Float!
  initialSalesRevenue: Float!
  recurringRevenue: Float!
  revenuePerSellingPro: Float!

  # NEW — source attribution (combined/system views only)
  salesCountBySource: SourceBreakdown!
  revenueBySource: SourceBreakdownFloat!

  # NEW — per-pro attribution (single-manager views only)
  topSellingContributors: [ProContributorFloat!]!
  othersSellingRevenue: Float!
}
```

`topSellingContributors[].amount` is total revenue attributed to that pro this period. Sorted desc by amount. Top ~6.

### 2.4 `topN` cap

Six is a reasonable default. If any real roster has >6 significant contributors, the "others" bucket surfaces that (and the FE can offer "See all" → drawer). Don't parameterise `topN` on the input — a stable N keeps the query cache-friendly and the payload predictable.

---

## 3. Implementation

### 3.1 Source classification helper

New helper in `src/services/admin/manager/dashboardService.ts` (or a small util file next to it).

```ts
export type SourceBucket = "managed" | "unassigned" | "users" | "associate";

/** Classify a referrer (user document) into one of the four source buckets. */
export const classifySource = (
  referrer: { _id: any; referral_status: string },
  managedProIdSet: Set<string>
): SourceBucket => {
  if (referrer.referral_status === "associate-pro") {
    return managedProIdSet.has(referrer._id.toString()) ? "managed" : "unassigned";
  }
  if (referrer.referral_status === "associate") return "associate";
  return "users"; // default for "user" tier, and for anything else that shouldn't happen
};

/** Build the union set of all managed pro IDs (present in any manager's roster). */
export const buildManagedProIdSet = async (): Promise<Set<string>> => {
  const managers = await associateManagerModel
    .find({})
    .select("associate_pros")
    .lean();
  const set = new Set<string>();
  for (const m of managers) {
    for (const id of (m.associate_pros || []) as any[]) {
      set.add(String(id));
    }
  }
  return set;
};
```

Call `buildManagedProIdSet()` once at the top of each dashboard builder that needs the source classification, then pass the set into the loops.

### 3.2 `newSignupsBySource` — the org attribution counts

Every "new recruit in period" is a `Referral` document whose referred person joined the system in the period. Aggregate by classifying the referrer.

Rough sketch in `buildAllManagersDashboard` / `buildSystemAssociatesDashboard`:

```ts
const managedProIdSet = await buildManagedProIdSet();

// All Referral rows whose referred user joined in [start, end]. Referral has
// { user (referrer), email (referred person's email) }.
const periodReferrals = await referralModel
  .find({ createdAt: { $gte: start, $lte: end } })
  .populate({ path: "user", select: "referral_status" })
  .lean();

const newSignupsBySource: SourceBreakdown = { managed: 0, unassigned: 0, users: 0, associate: 0 };
for (const r of periodReferrals) {
  if (!r.user) continue; // referrer deleted or invalid
  newSignupsBySource[classifySource(r.user as any, managedProIdSet)] += 1;
}
```

Same shape for `upgradesBySource` — read from `referralUpgradeModel` with `admin_status: "approved"` in the period, populate the referrer, classify.

**Caveat on `newSignupsInPeriod`**: the existing per-manager count filters the manager's roster by `createdAt`, which is "pros who joined the roster in period." The org-wide `newSignupsBySource` should count **all referrals in the period** across all tiers, not just pros. Confirm with product what the label means to align — the FE label already reads "People your pros brought in this period (all tiers)."

### 3.3 `salesCountBySource` + `revenueBySource`

A sale is a `transactionModel` document with `type: "asset"`, `status: "completed"`, `admin_status: "approved"`. Attribute to the BUYER's referrer — the referrer's status decides the bucket.

```ts
const periodSales = await transactionModel
  .find({
    type: "asset",
    status: "completed",
    admin_status: "approved",
    createdAt: { $gte: start, $lte: end },
  })
  .populate({
    path: "user",
    populate: { path: "referrer", select: "referral_status" }, // if referrer is a User ref
  })
  .lean();

const salesCountBySource: SourceBreakdown = { managed: 0, unassigned: 0, users: 0, associate: 0 };
const revenueBySource: SourceBreakdownFloat = { managed: 0, unassigned: 0, users: 0, associate: 0 };

for (const t of periodSales) {
  const referrer = (t.user as any)?.referrer;
  if (!referrer) { salesCountBySource.users += 1; revenueBySource.users += t.amount || 0; continue; }
  const bucket = classifySource(referrer, managedProIdSet);
  salesCountBySource[bucket] += 1;
  revenueBySource[bucket] += t.amount || 0;
}
```

**Verify buyer → referrer resolution**: the buyer might reference their referrer via an `email` field or a `User` ref. Check `userModel`'s schema and adapt the populate accordingly. If it's an email lookup, you'll need a second query to resolve emails → referrer users, then classify.

### 3.4 `topNewSignupsContributors` — per-pro attribution

On single-manager views, group the period's recruits by which pro on the manager's roster caused them. Top N by count, sum the rest as `others*Count`.

Inside `buildDashboard(managerAdminId, filter)`:

```ts
const managerDoc = await getAssociateManagerByManagerId(managerAdminId);
const rosterProIds = (managerDoc?.associate_pros || []).map((id) => id.toString());

// Referrals in period authored by anyone on this manager's roster.
const rosterReferrals = await referralModel.aggregate([
  {
    $match: {
      user: { $in: rosterProIds.map((id) => new Types.ObjectId(id)) },
      createdAt: { $gte: start, $lte: end },
    },
  },
  { $group: { _id: "$user", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

const topN = 6;
const top = rosterReferrals.slice(0, topN);
const others = rosterReferrals.slice(topN);
const othersNewSignupsCount = others.reduce((sum, r) => sum + r.count, 0);

// Enrich top N with pro names via a single userModel lookup.
const topProIds = top.map((r) => r._id);
const topProNames = await userModel
  .find({ _id: { $in: topProIds } })
  .select("firstName lastName email")
  .lean();
const nameByProId = new Map(topProNames.map((u) => [u._id.toString(), u]));

const topNewSignupsContributors = top.map((r) => {
  const name = nameByProId.get(r._id.toString());
  return {
    proId: r._id.toString(),
    firstName: name?.firstName ?? null,
    lastName: name?.lastName ?? null,
    email: name?.email ?? null,
    count: r.count,
  };
});
```

### 3.5 `topUpgradesContributors`

Same shape but source is `referralUpgradeModel` with `admin_status: "approved"` in the period, filtered to the manager's roster (`user` field = the roster pro who caused the upgrade).

### 3.6 `topSellingContributors`

The manager's roster's downline sales. This one's trickier because a sale is on the BUYER, not the referrer. Two-step:

1. Find all buyers referred by anyone on the roster (via `referralModel` where `user ∈ rosterProIds`, then look up those users by email).
2. Sum `transactionModel` amounts for those buyers in the period.
3. Group the summed amount BY the referrer (roster pro), sort desc, take top N.

Uses the same "sale group" logic that already exists in `computeDashboard` (see the `groupIdsByPro` map at ~line 190). You may be able to reuse or extend that map rather than re-querying.

---

## 4. Population matrix — which fields for which view

| Field | admin single manager | manager self | all managers combined | system associates |
|---|---|---|---|---|
| `newSignupsBySource` | zeroed | zeroed | ✅ populate | ✅ populate |
| `upgradesBySource` | zeroed | zeroed | ✅ populate | ✅ populate |
| `salesCountBySource` | zeroed | zeroed | ✅ populate | ✅ populate |
| `revenueBySource` | zeroed | zeroed | ✅ populate | ✅ populate |
| `topNewSignupsContributors` | ✅ populate | ✅ populate | `[]` | `[]` |
| `topUpgradesContributors` | ✅ populate | ✅ populate | `[]` | `[]` |
| `topSellingContributors` | ✅ populate | ✅ populate | `[]` | `[]` |
| `othersNewSignupsCount` / `othersUpgradesCount` / `othersSellingRevenue` | ✅ populate | ✅ populate | `0` | `0` |

Deliberately non-null (zero/empty rather than `null`) so the FE never has to guard for absence.

---

## 5. Performance

- **`buildManagedProIdSet()`** is one indexed find over `associateManagerModel` — small collection, negligible.
- **Period referrals populated**: index on `Referral.createdAt` (should already exist) and `Referral.user`. Verify.
- **Period sales populated**: index on `Transaction.createdAt` + `type` + `status` (should already exist).
- **Contributor aggregations** on `referralModel` and `referralUpgradeModel`: `$match` uses the `user` field — should be indexed. If not, add `{ user: 1, createdAt: -1 }` compound index.
- The per-pro contributor logic runs inside each per-manager dashboard call. If manager rosters get very large (>500 pros), consider capping the referrals fetch to top-K server-side instead of counting-then-sorting client-side.

---

## 6. Auth

No changes. These fields extend endpoints that already have their auth story:

- `adminGetManagerDashboard` — super admin only
- `managerDashboard` — the calling manager only
- `getAllManagersDashboard` — super admin only
- `getSystemAssociatesDashboard` — super admin only

No new auth checks needed. All fields are readable by anyone who can already read the enclosing endpoint.

---

## 7. Acceptance checklist

- [ ] `SourceBreakdown`, `SourceBreakdownFloat`, `ProContributor`, `ProContributorFloat` types exist in schema.
- [ ] `ManagerDashboardRecruitment` and `ManagerDashboardSalesRevenue` include the 4 new source fields + 3 new contributor fields + 3 new "others" fields.
- [ ] Single-manager endpoints return contributor lists populated + source fields zeroed.
- [ ] Combined-managers + system-associates endpoints return source fields populated + contributor lists empty + others = 0.
- [ ] `classifySource` correctly buckets: managed pro → `managed`; unassigned pro → `unassigned`; associate-tier → `associate`; regular user → `users`.
- [ ] Per-pro contributor lists sorted desc by count/amount, capped at 6, with the remainder summed into `others*`.
- [ ] Revenue attribution matches the existing `totalRevenue` in aggregate (sum of `revenueBySource.*` = `totalRevenue`).
- [ ] Sales-count attribution matches the existing sales aggregation.
- [ ] All fields non-null, no `null` values in list/breakdown outputs.
- [ ] `npm run test` (or whatever the BE runs) green.

---

## 8. FE side (short — separate ticket coming)

- Extend `StatCard` with an optional `breakdown?: BreakdownSegment[]` prop.
- Wire 4 cards (New Recruits, Recruits Promoted, Sales, Revenue) across `RecruitmentSection` + `SalesRevenueSection`.
- Decide which data to feed each card based on view mode (combined → source; single-manager → contributors).
- Legend items become clickable → open existing `ProGroupDrawer` filtered to that source or contributor.

Estimated FE work: ~1 day once BE ships.

---

## 9. Rollout order

1. **BE** — ship all 4 fields at once. Roughly 1.5 days of aggregation work (contributors are the biggest chunk; source classification is a small helper).
2. **FE** — one commit adds `breakdown` prop + wiring on the 4 cards. ~1 day.
3. **QA** — verify the source split for one recent period against a manually-run mongo query on referral data.

Total: **~3 days end-to-end** with BE + FE in sequence, or ~2 days if FE prototypes with mocked data in parallel.
