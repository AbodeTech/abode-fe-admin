# CS Manager Dashboard — BE ticket

Introduces the Customer Success Manager (CSM) admin surface. Analog of
the Associate Pro Manager (APM) dashboard, but for the post-purchase
customer journey (onboarding call → allocation → Deed of Assignment
delivery) instead of the recruit-and-sell axis.

## Domain summary

- **CSM is a promoted admin role** (many admins can hold it at once,
  like APM — NOT single-holder like FLEX Manager).
- **Customers are assigned manually** to a CSM by a super admin. Once
  assigned, sticky — every future purchase stays with that CSM. No
  auto-assignment, no round-robin.
- **The CSM owns a customer end-to-end**: onboarding phone call →
  allocation → DoA delivery.
- **Work is measured per payment plan**, not per customer. A customer
  with two active plans generates two distinct work items on the CSM's
  dashboard. Total Assigned still counts unique customers.
- **Every new purchase requires a fresh onboarding call**, even for
  repeat customers.

## Table of contents

1. Role assignment (CSM promotion)
2. Customer → CSM assignment
3. Onboarding calls (new domain concept)
4. Deed of Assignment delivery (new domain concept)
5. Targets
6. Dashboard aggregations
7. Unassigned queue
8. Acceptance checklist
9. Out of scope for v1
10. FE plan (post-BE)

---

## 1. Role assignment

Same pattern as APM's `associateManagerAssignment`.

### New model — `CSManagerAssignment`

Log of who has held the role and when. Adds a new row on promotion;
closes the row (`assigned_to = now`) on removal.

```ts
{
  manager: Schema.Types.ObjectId,      // ref Admin
  assigned_from: Date,
  assigned_to: Date | null,            // null = currently active
  created_by: Schema.Types.ObjectId,   // super admin who promoted them
}
```

**Invariant**: for any given `manager`, at most one row with
`assigned_to: null` at a time (an admin can't be an active CSM twice).

**Multiple admins can be active CSMs simultaneously** — different from
FlexManagerAssignment.

### Mutations

```graphql
addCSManager(managerId: ID!): CSManagerAssignmentType!
removeCSManager(managerId: ID!): CSManagerAssignmentType!
```

Both **super-admin only**. `removeCSManager` closes the current row —
optionally could also cascade-close all `CustomerToCSManager` rows
where this manager is the CSM (leaving those customers unassigned).
Recommend: leave the assignments intact and surface them as "orphaned"
in the unassigned queue, so ops explicitly reassigns instead of
customers silently disappearing from a book.

### Query

```graphql
listCSManagers: [CSManagerSummary!]!

type CSManagerSummary {
  _id: ID!
  manager: Admin!
  assignedCustomersCount: Int!
  assignedPlansCount: Int!
  currentPeriodScore: Float          # null if no dashboard computed yet
  activeSince: Date!
}
```

---

## 2. Customer → CSM assignment

### New model — `CustomerToCSManager`

```ts
{
  customer: Schema.Types.ObjectId,     // ref User
  csManager: Schema.Types.ObjectId,    // ref Admin
  assigned_from: Date,
  assigned_to: Date | null,            // null = currently active
  created_by: Schema.Types.ObjectId,   // super admin who assigned
}
```

**Invariant**: for any given `customer`, at most one row with
`assigned_to: null` at a time. Reassigning closes the current row and
opens a new one.

### Mutation

```graphql
input AssignCustomersToCSMInput {
  customerIds: [ID!]!
  managerId: ID!
}

assignCustomersToCSManager(input: AssignCustomersToCSMInput!): AssignCustomersResult!

type AssignCustomersResult {
  assigned: Int!
  managerId: ID!
}
```

Bulk and single are both this mutation — FE calls with either 1 or N
customer ids. Super-admin only.

**Business rule** — a repeat purchase by an already-assigned customer
does NOT create a new assignment row. The existing row still points to
their current CSM; the new plan simply appears in that CSM's
onboarding queue.

---

## 3. Onboarding calls — new domain concept

Every new payment plan requires a phone call from the CSM to gather
intel on why the customer chose the land. This is the CSM's primary
action.

### New model — `CustomerOnboardingAttempt`

```ts
{
  payment_plan: Schema.Types.ObjectId,   // ref PaymentPlan — one plan can have many attempts
  customer: Schema.Types.ObjectId,       // ref User
  csm: Schema.Types.ObjectId,            // ref Admin
  outcome: "spoke" | "no_answer" | "rescheduled" | "done",
  land_choice_reason: string | null,     // the intel from the call
  notes: string | null,
  called_at: Date,
}
```

**Semantics**
- Multiple attempts allowed per plan (calls that don't connect count as
  attempts but don't tick the "onboarded" counter).
- A plan is considered ONBOARDED when it has ≥1 attempt with
  `outcome: "done"`.

### Mutations

```graphql
input LogOnboardingCallInput {
  paymentPlanId: ID!
  outcome: OnboardingOutcome!          # enum matching the union above
  landChoiceReason: String
  notes: String
}

logOnboardingCall(input: LogOnboardingCallInput!): CustomerOnboardingAttempt!
```

CSM-only (or super-admin acting on behalf). Auto-fills
`csm` from context, `customer` from plan, `called_at = now`.

### Query

```graphql
listOnboardingAttempts(paymentPlanId: ID!): [CustomerOnboardingAttempt!]!
```

Used on a plan-detail drawer to show the call history.

---

## 4. Deed of Assignment delivery — new domain concept

### Field addition on `PaymentPlan`

```ts
deed_delivered_at: Date | null,     // set when DoA sent to customer
deed_delivered_by: Schema.Types.ObjectId | null,   // ref Admin
```

### Eligibility rules (computed, NOT stored)

A plan becomes eligible for DoA delivery when:

- **Flex plans**: `plan.status === "land_paid"` (or whatever field
  marks "land portion complete" — verify what the current model uses)
- **Full-ownership plans**: `plan.status === "land_paid"` **AND** the
  associated documentPlan is complete

Expose as a helper `isEligibleForDoA(plan)` on the plan model or in a
utility. The dashboard aggregations and the DoA queue query use this.

### Mutation

```graphql
markDeedDelivered(paymentPlanId: ID!): PaymentPlan!
```

Sets `deed_delivered_at = now`, `deed_delivered_by = context.admin._id`.
Idempotent — if already set, returns the existing plan without change.

**Guard**: reject if the plan isn't yet eligible (return an error the
FE can toast). Prevents admins marking DoAs on unpaid plans.

---

## 5. Targets

Same shape as `AssociateManagerTarget`.

### New model — `CSManagerTarget`

```ts
{
  manager: Schema.Types.ObjectId,             // ref Admin
  month: number,
  year: number,
  customers_allocated_target: number,         // Int
  customers_onboarded_target: number,         // Int
  deeds_delivered_target: number,             // Int
  performance_score_target: number,           // Int — optional peer rating target
  created_by: Schema.Types.ObjectId,
}
```

**Unique** on `(manager, month, year)`.

### Mutation

```graphql
input AssignCSManagerTargetInput {
  managerId: ID!
  month: Int!
  year: Int!
  customers_allocated_target: Int
  customers_onboarded_target: Int
  deeds_delivered_target: Int
  performance_score_target: Int
}

assignCSManagerTarget(input: AssignCSManagerTargetInput!): CSManagerTargetType!
```

Super-admin only.

### Queries

```graphql
getCSManagerTarget(managerId: ID!, month: Int, year: Int): CSManagerTargetType
listCSManagerTargets(managerId: ID!): [CSManagerTargetType!]!
```

---

## 6. Dashboard aggregations

The one big query FE consumes:

```graphql
getCSManagerDashboard(managerId: ID!, month: Int, year: Int): CSManagerDashboardResponse!

type CSManagerDashboardResponse {
  period: CSManagerPeriod!
  manager: Admin!
  target: CSManagerTargets!
  performanceScore: CSManagerPerformanceScore!
  obligation: CSManagerObligation!
  backlogs: CSManagerBacklogs!
  portfolio: CSManagerPortfolio!
  plans: [PlanRow!]!
}
```

### Target block

```graphql
type CSManagerTargets {
  allocatedTarget: Int!
  allocatedSoFar: Int!

  onboardedTarget: Int!
  onboardedSoFar: Int!

  deedsDeliveredTarget: Int!
  deedsDeliveredSoFar: Int!

  performanceScoreTarget: Int!
  performanceScoreSoFar: Float!
}
```

**Definitions of "SoFar" (all filtered to plans belonging to customers
currently assigned to this manager):**

- `allocatedSoFar` — count of payment plans allocated a plot within
  `[start, end]`
- `onboardedSoFar` — count of DISTINCT payment plans with ≥1 onboarding
  attempt where `outcome: "done"` inside `[start, end]`
- `deedsDeliveredSoFar` — count of payment plans with
  `deed_delivered_at ∈ [start, end]`
- `performanceScoreSoFar` — average peer rating (see §7)

### Performance score (computed)

```graphql
type CSManagerPerformanceScore {
  score: Float!                  # 0-100
  allocatedComponent: Float!     # max 40 (default weight — tunable)
  onboardedComponent: Float!     # max 30
  deedsComponent: Float!         # max 30
  target: Int!                   # unchanged — peer rating target
  actual: Float!                 # unchanged — avg peer rating
  ratingCount: Int!
}
```

**Formula** (same rules as APM/FLEX — untargeted components contribute
0 and their weight is NOT redistributed):

```ts
const capped = (soFar, target) => target > 0 ? Math.min(1, soFar / target) : 0;

const allocatedComponent = capped(allocatedSoFar, allocatedTarget) * 40;
const onboardedComponent = capped(onboardedSoFar, onboardedTarget) * 30;
const deedsComponent     = capped(deedsDeliveredSoFar, deedsDeliveredTarget) * 30;

const score = Number((allocatedComponent + onboardedComponent + deedsComponent).toFixed(1));
```

Weights (40/30/30) chosen because allocation is the most
customer-visible failure mode (paid but no plot). Tunable — confirm
with product before locking.

### Obligation block

```graphql
type CSManagerObligation {
  paidNotAllocatedThisPeriod: Int!
}
```

Count of payment plans belonging to this CSM's assigned customers
where:
- The land payment completed inside `[start, end]`, **AND**
- The plot has NOT been allocated yet

This is the "you owe these people a plot THIS MONTH" signal — surfaces
even when `allocatedSoFar >= allocatedTarget` (a CSM can hit their
minimum target but still owe customers). Renders as a red strip on the
Allocation tile.

### Backlogs

```graphql
type CSManagerBacklogs {
  allocation: AgeSplitBacklog!
  onboarding: OnboardingBacklog!
  doa: AgeSplitBacklog!
}

type AgeSplitBacklog {
  total: Int!
  thisMonth: Int!
  lastMonth: Int!
  older: Int!
}

type OnboardingBacklog {
  total: Int!
  callPending: Int!       # plans with 0 onboarding attempts logged
  confirmPending: Int!    # attempts done, awaiting buyer confirmation via /purchase/confirm/{id}
  disputed: Int!          # buyer clicked "dispute" on the confirmation link
}
```

**Definitions** (all scoped to plans in this CSM's book):

- `allocation.total` — every plan with completed payment and no
  allocation, regardless of when payment completed
- `allocation.thisMonth` / `lastMonth` / `older` — split by the month
  the plan's land payment was completed
- `onboarding.callPending` — plans opened at any time (all-time backlog
  for missed calls), with 0 onboarding attempts logged
- `onboarding.confirmPending` — plans with ≥1 "done" onboarding attempt
  where the buyer confirmation loop is still `pending`
- `onboarding.disputed` — plans with `disputed` confirmation status
- `doa.total` — plans eligible for DoA (per §4 rules) with
  `deed_delivered_at: null`
- `doa.thisMonth` / `lastMonth` / `older` — split by when the plan
  became eligible (i.e., when the last-required payment / doc plan
  completed)

Backlogs are **all-time**, not period-scoped — they're the queue of
work the CSM needs to burn down independently of the current-month
targets.

### Portfolio (rolling counts across the roster)

```graphql
type CSManagerPortfolio {
  totalAssigned: Int!             # unique customers currently assigned
  completedPayment: Int!          # customers with ≥1 plan whose land payment is complete
  withinPaymentPeriod: Int!       # customers with ≥1 active (non-completed, non-defaulted) plan
  closeToDefaulting: Int!         # customers with ≥1 plan ≤ 1 month from default
}
```

Not tied to the current period. Rolling snapshot.

### Plans list

```graphql
type PlanRow {
  planId: ID!
  customer: PlanRowCustomer!
  priorPlansCount: Int!           # OTHER plans this customer has (all-time)
  asset: String!
  product: FlexOrFullownership!
  purchaseDate: Date!
  paymentStatus: PaymentStatus!   # in_plan | completed | close_to_default
  paymentLabel: String!           # "4 of 12" | "Completed" | "1 mo to default"
  onboarding: OnboardingStatus!   # call_pending | confirmed | disputed | not_applicable
  allocation: AllocationStatus!   # awaiting | allocated | not_applicable
  allocationLabel: String         # plot code when allocated
  doa: DoaStatus!                 # not_sent | sent | not_applicable
  doaLabel: String                # "Sent 12 Sep"
  lastActivityAt: Date!
}

type PlanRowCustomer {
  id: ID!
  firstName: String!
  lastName: String!
  email: String!
}
```

**One row per PAYMENT PLAN**, not per customer. A customer with two
active plans surfaces as two rows — each carries its own
onboarding/allocation/DoA status. The `priorPlansCount` field lets the
FE hint "repeat buyer" on the row.

Paginated (accept `page`, `limit` params). Server-side sort by
`lastActivityAt DESC` default; accept `sort` param analogous to APM.

---

## 7. Peer rating

Existing pattern from APM — a `ManagerRating` model with `rater`,
`ratee`, `score` (1-5), `period` (month, year). CSM peer rating
plugs into the same model (or a CSM-scoped copy). Return as
`performanceScore.actual` (average) and `performanceScore.ratingCount`
(number of ratings this period).

If ops decides peer rating doesn't apply for CS (different from sales
roles), leave `target: 0`, `actual: 0`, `ratingCount: 0` — the FE
already handles the "No ratings yet" empty state.

---

## 8. Unassigned queue

```graphql
listUnassignedCustomers(page: Int, limit: Int): UnassignedCustomerListResponse!

type UnassignedCustomerListResponse {
  count: Int!
  results: [UnassignedCustomer!]!
}

type UnassignedCustomer {
  _id: ID!
  firstName: String!
  lastName: String!
  email: String!
  phone: String
  firstPurchaseAt: Date!
  daysUnassigned: Int!         # today - firstPurchaseAt
  planCount: Int!              # how many of their plans lack a CSM
}
```

**Definition of "unassigned"**: user has at least one payment plan (any
status) and NO row in `CustomerToCSManager` with `assigned_to: null`.

Sort server-side by `firstPurchaseAt ASC` (oldest at top).

Super-admin only.

---

## 9. Acceptance checklist

- [ ] `CSManagerAssignment` model with single-active-per-manager invariant
- [ ] `CustomerToCSManager` model with single-active-per-customer invariant
- [ ] `CustomerOnboardingAttempt` model
- [ ] `PaymentPlan` gains `deed_delivered_at` + `deed_delivered_by`
- [ ] `CSManagerTarget` model, unique per `(manager, month, year)`
- [ ] `addCSManager` / `removeCSManager` — super-admin only
- [ ] `assignCustomersToCSManager` — accepts N ids in one call
- [ ] `logOnboardingCall` — CSM (or super-admin) only
- [ ] `markDeedDelivered` — rejects when plan isn't eligible
- [ ] `assignCSManagerTarget` — super-admin only
- [ ] `getCSManagerDashboard` returns every numeric group (target,
      actuals, obligation, backlogs, portfolio, plans)
- [ ] Score formula: components are 0-capped, weights not redistributed
- [ ] Row shape is per-payment-plan (a customer with two plans → two rows)
- [ ] `priorPlansCount` populated correctly (all-time count, not
      period-scoped)
- [ ] `listUnassignedCustomers` — sorted oldest-first
- [ ] `listCSManagers` — includes `assignedCustomersCount`,
      `assignedPlansCount`, and `currentPeriodScore` (nullable when no
      target set)
- [ ] Reassigning a customer closes prior row + opens new — no data loss
- [ ] Repeat purchase by an assigned customer does NOT create a new
      assignment row

---

## 10. Out of scope for v1

- Automated round-robin assignment at purchase time (deferred — pure
  manual for now, safety net is the unassigned queue)
- Multi-CSM co-ownership (one customer, one CSM at a time)
- CSM history viewer (records exist, no default UI)
- Regional CSM assignment
- SLA email alerts for overdue unassigned customers (banner + red
  overdue chip is enough for v1)
- DoA delivery method tracking (WhatsApp / email / physical) — v1 is
  binary sent-yes/no
- Customer-level notes (belong to Onboarding attempts or plan-level
  notes, not a separate concept)

---

## 11. FE plan (already built — pending BE swap)

FE landed on `feat/manager-revenue-target-and-score` with typed mocks
in `features/cs-managers/`. Once BE ships:

1. Swap each mock hook body for `execute(graphql(\`…\`))`:
   - `useCSManagerDashboard` → `getCSManagerDashboard`
   - `useCSManagersList` → `listCSManagers`
   - `useUnassignedCustomers` → `listUnassignedCustomers`
   - `useAdminOptions` → reuse existing admin picker if present,
     otherwise new `listAdmins`
   - Mutations: `useAddCSManager`, `useRemoveCSManager`,
     `useAssignCustomersToCSM`
2. Delete the local mock data blocks in each hook
3. Delete `features/cs-managers/types.ts` — consumers import from
   `@/lib/gql/graphql` directly (same pattern used for FLEX Manager)
4. Consumer components (snapshots, dialogs, tables) don't change

Routes already live:
- `/customer-managers` — CS managers list + banner for unassigned queue
- `/customer-managers/[id]` — per-manager dashboard
- `/customer-managers/unassigned` — super-admin queue
