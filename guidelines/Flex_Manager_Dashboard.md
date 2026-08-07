# FLEX Manager Dashboard — BE ticket

Introduces a **single-holder** admin role that owns the Flex product's
performance. Analog of the Associate Pro Manager (APM) and CS Manager
dashboards, but:

- Only **one** admin can hold the role at a time.
- No per-customer roster — the FM operates at portfolio level.
- Score is a strict weighted mix of **three** targets (50/30/20).
- History of past holders is stored (audit) but the default dashboard
  view is current-holder / current-month only. No history tab in v1.

Small ticket relative to APM/CS. No new customer relationships, no new
onboarding flows — just aggregations over existing Flex transactions
and a new role assignment.

---

## 1. Role assignment

### New model — `FlexManagerAssignment`

Log of who held the role and when. Reassigning closes the current
row (`assignedTo = now`) and opens a new one.

```ts
{
  manager: Schema.Types.ObjectId,   // ref Admin
  assignedFrom: Date,
  assignedTo: Date | null,          // null = currently active
  createdBy: Schema.Types.ObjectId, // super admin who did the assignment
}
```

**Invariants** enforced at the mutation layer:
- At most ONE row with `assignedTo: null` at any time.
- Reassigning immediately closes the current row and opens the new one
  effective now (mid-month cutovers are allowed).

### Mutations

```graphql
assignFlexManager(managerId: ID!): FlexManagerAssignment!
unassignFlexManager: FlexManagerAssignment!   # closes current, leaves role empty
```

Both **super-admin only**. Both write to the assignment log.

### Query

```graphql
getFlexManager: FlexManager   # null-safe: returns null when role is unassigned

type FlexManager {
  manager: Admin!
  assignedFrom: Date!
}
```

---

## 2. Targets

### New model — `FlexManagerTarget`

Same shape as the existing `AssociateManagerTarget`, embedding the
manager reference so audit survives reassignment.

```ts
{
  manager: Schema.Types.ObjectId,   // ref Admin — whoever was FM at the time
  month: number,
  year: number,
  new_customers_target: number,     // Int
  new_sales_value_target: number,   // Float (₦)
  recurring_target: number,         // Float (₦)
  createdBy: Schema.Types.ObjectId, // super admin who set it
}
```

**Unique** on `(manager, month, year)` — a manager can only have one
target per month. If you want to re-target after reassignment, that's
a new record under the new manager for the same month.

### Mutation

```graphql
input AssignFlexManagerTargetInput {
  managerId: ID!    # who this target belongs to (usually the current FM)
  month: Int!
  year: Int!
  new_customers_target: Int!
  new_sales_value_target: Float!
  recurring_target: Float!
}

assignFlexManagerTarget(input: AssignFlexManagerTargetInput!): FlexManagerTargetType!
```

Super-admin only.

### Queries

```graphql
getFlexManagerTarget(managerId: ID!, month: Int, year: Int): FlexManagerTargetType
listFlexManagerTargets(managerId: ID!): [FlexManagerTargetType!]!
```

---

## 3. Dashboard

### Query

```graphql
getFlexManagerDashboard(month: Int, year: Int): FlexManagerDashboardResponse!

type FlexManagerDashboardResponse {
  period: FlexManagerPeriod!
  manager: Admin              # null if no one currently holds the role
  target: FlexManagerTarget!  # zeros throughout if not set
  performanceScore: FlexManagerPerformanceScore!
}

type FlexManagerPeriod {
  periodType: PeriodType!
  month: Int
  year: Int
  start: Date!
  end: Date!
}

type FlexManagerTarget {
  # Targets
  newCustomersTarget: Int!
  newCustomersSoFar: Int!

  newSalesValueTarget: Float!    # ₦
  newSalesValueSoFar: Float!     # ₦

  recurringTarget: Float!        # ₦
  recurringSoFar: Float!         # ₦ actually collected
  recurringExpected: Float!      # ₦ the system EXPECTS this month (see §4)
}

type FlexManagerPerformanceScore {
  score: Float!                  # 0-100, weighted mix
  newCustomersComponent: Float!  # max 50
  newSalesComponent: Float!      # max 30
  recurringComponent: Float!     # max 20
}
```

**Population**
- If no FM assigned → `manager: null`, all targets and actuals zeroed. FE
  shows an empty state / "Assign a FLEX Manager" CTA.
- If no target set for the period → target fields are 0, `soFar` fields
  still populated (actuals always compute). Score components for
  untargeted axes are 0 and weight is NOT redistributed (same rule as
  APM/CS).

---

## 4. Computations

All scoped to `product == "flex"` on the underlying transaction / plan.

### `newCustomersSoFar`

Count of **unique users** whose FIRST Flex purchase (initial payment)
falls inside the period.

```ts
// Find the earliest completed+approved Flex "asset" transaction per user,
// then count those whose earliest is in [start, end].
const firstFlex = await transactionModel.aggregate([
  {
    $match: {
      type: "asset",
      status: "completed",
      admin_status: "approved",
      product: "flex",
    },
  },
  { $group: { _id: "$user", first: { $min: "$createdAt" } } },
  { $match: { first: { $gte: start, $lte: end } } },
  { $count: "n" },
]);
const newCustomersSoFar = firstFlex[0]?.n ?? 0;
```

A repeat Flex customer opening a second plan in the period does NOT count.

### `newSalesValueSoFar`

Sum of `amount` on initial-payment Flex transactions in the period. An
initial payment is the first transaction against a payment plan (or
the transaction that opens the plan). Existing sales aggregations
already distinguish initial vs recurring — reuse the same predicate.

```ts
const initSales = await transactionModel.aggregate([
  {
    $match: {
      type: "asset",
      product: "flex",
      status: "completed",
      admin_status: "approved",
      // is_initial: true  OR  the same predicate SELLING_IN_PERIOD uses
      createdAt: { $gte: start, $lte: end },
    },
  },
  { $group: { _id: null, total: { $sum: "$amount" } } },
]);
const newSalesValueSoFar = initSales[0]?.total ?? 0;
```

Confirm which field distinguishes initial vs recurring in
`transactionModel` — the existing `SELLING_IN_PERIOD` logic in
`dashboardService.ts` already does this, reuse verbatim.

### `recurringSoFar`

Same shape as new-sales-value, but on RECURRING transactions:

```ts
{
  type: "asset",
  product: "flex",
  status: "completed",
  admin_status: "approved",
  // is_recurring: true  OR  is_initial: false
  createdAt: { $gte: start, $lte: end },
}
```

### `recurringExpected` — **new aggregation**

For every ACTIVE Flex payment plan (not suspended, not completed,
not defaulted), sum the amount scheduled to be paid this period.

Two possible sources depending on how plans are structured today:

**Option A — schedule-driven**: each plan has an installments array
with `dueDate + amount`. Sum installments where `dueDate ∈ [start, end]`
across all active Flex plans.

**Option B — monthly-payment-driven**: each plan has a
`monthlyAmount` and `nextDueDate`. If `nextDueDate ∈ [start, end]`,
add `monthlyAmount` to the expected total.

Verify how `paymentPlanModel` structures schedules and pick the fit.

Cache this per period if it's expensive — recomputing on every
dashboard hit is fine at the current scale.

### `score` — weighted mix

```ts
const capped = (soFar: number, target: number) =>
  target > 0 ? Math.min(1, soFar / target) : 0;

const newCustomersComponent = capped(newCustomersSoFar, newCustomersTarget)  * 50;
const newSalesComponent     = capped(newSalesValueSoFar, newSalesValueTarget) * 30;
const recurringComponent    = capped(recurringSoFar, recurringTarget)         * 20;

const score = Number(
  (newCustomersComponent + newSalesComponent + recurringComponent).toFixed(1)
);
```

Untargeted components contribute 0. Their weight is **not**
redistributed — same rule as APM/CS.

---

## 5. Acceptance checklist

- [ ] `FlexManagerAssignment` model with the single-active invariant enforced
- [ ] `assignFlexManager` / `unassignFlexManager` mutations, super-admin gated
- [ ] `getFlexManager` returns null when unassigned
- [ ] `FlexManagerTarget` model, unique per `(manager, month, year)`
- [ ] `assignFlexManagerTarget` mutation, super-admin gated
- [ ] `getFlexManagerDashboard` returns all 4 numeric groups (targets, actuals, expected recurring, score)
- [ ] Score matches the formula for every combination of "some targets set / some missing"
- [ ] Aggregations filter strictly to `product == "flex"`
- [ ] Reassigning mid-month leaves prior target/assignment records intact

---

## 6. Out of scope for v1

- Multi-manager views (impossible — single role)
- Backlog cards (deferred; targets + expected-recurring already carry the story)
- Peer rating (deferred; solo role, no peer set)
- Customer-level drill-downs (FM is portfolio-scoped)
- History tab showing past holders and their scores (records are stored,
  but no viewer in v1 — add later if product asks)

---

## 7. FE plan (post-BE)

Same shape as the CS Manager rollout:
1. `features/flex-manager/` feature module — types + mock hook + components
2. `/flex-manager` page — single dashboard, super-admin sees reassign + set-target actions
3. Sidebar: "Flex" group with one item ("FLEX Manager Performance")
4. Empty state when `getFlexManager` returns null
5. Swap the mock hook body for `execute()` once BE ships — consumers unchanged
