# Analytics API Requirements


This document outlines all the data the frontend expects from the backend for the **User Analytics** page (`/analytics/users`) and the **Sales Analytics** page (`/analytics/sales`).

All queries follow the existing GraphQL pattern used throughout the project.

---

## 1. User Analytics Page — `/analytics/users`

### Filters available on this page
| Filter | URL Param | Type | Notes |
|--------|-----------|------|-------|
| Date Range | `start_date`, `end_date` | `String` (YYYY-MM-DD) | Optional |
| User Status | `userStatus` | `String` | `"user"` \| `"associate"` \| `"associate-pro"` |

All filters should be accepted as optional arguments on the query. When not provided, return data for all users of all time.

---

### 1.1 Conversion & Growth Section

> **Status: Already exists.** This section uses the existing `getSystemUsersOverview` query. No new endpoint needed.

Fields already consumed from `getSystemUsersOverview`:
- `metrics.totalUsers`
- `metrics.referralStatusCounts.user`
- `metrics.referralStatusCounts.associate`
- `metrics.referralStatusCounts.associatePro`
- `metrics.active_associate`
- `metrics.active_associate_pro`

The frontend derives:
- **User → Associate Pro conversion rate** = `associatePro / totalUsers * 100`
- **Associate → Associate Pro upgrade rate** = `associatePro / associate * 100`
- **Associate activity rate** = `(active_associate + active_associate_pro) / (associate + associatePro) * 100`

---

### 1.2 Acquisition & Demographics Section

> **Status: New query required.** The frontend calls `getUserAnalytics`.

#### Query

```graphql
query GetUserAnalytics($startDate: String, $endDate: String, $userStatus: String) {
  getUserAnalytics(startDate: $startDate, endDate: $endDate, userStatus: $userStatus) {
    acquisition {
      registrationTrend {
        month   # e.g. "Jan '25"
        count   # number of new registrations that month
      }
      howYouHeard {
        source  # e.g. "Social Media", "Billboard", "Someone invited me"
        count   # number of users who selected this source
      }
    }
    demographics {
      gender {
        label   # e.g. "Male", "Female", "Prefer not to say"
        count
      }
      ageGroups {
        label   # e.g. "18–25", "26–35", "36–45", "46–55", "55+"
        count
      }
      maritalStatus {
        label   # e.g. "Single", "Married", "Divorced", "Widowed"
        count
      }
      locations {
        label   # State or country e.g. "Lagos", "Abuja", "Diaspora"
        count
      }
      employmentStatus {
        label   # e.g. "Employed (Full-time)", "Self-employed", "Student"
        count
      }
      educationLevel {
        label   # e.g. "BSc / BA", "MSc / MBA", "HND", "OND", "PhD", "SSCE"
        count
      }
      experienceLevel {
        label   # e.g. "Entry (0–3 yrs)", "Mid-level (3–7 yrs)", "Senior (7–15 yrs)", "Expert (15+ yrs)"
        count
      }
      topOccupations {
        label   # e.g. "Software Engineer", "Business Owner", "Medical Doctor"
        count
      }
    }
  }
}
```

#### Expected Response Shape

```json
{
  "getUserAnalytics": {
    "acquisition": {
      "registrationTrend": [
        { "month": "Apr '24", "count": 120 },
        { "month": "May '24", "count": 185 }
      ],
      "howYouHeard": [
        { "source": "Someone invited me", "count": 1420 },
        { "source": "Social Media", "count": 870 },
        { "source": "Associate", "count": 640 },
        { "source": "Billboard", "count": 310 },
        { "source": "Email Newsletter", "count": 195 },
        { "source": "African Wealth Festival", "count": 140 },
        { "source": "Other", "count": 85 }
      ]
    },
    "demographics": {
      "gender": [
        { "label": "Male", "count": 2210 },
        { "label": "Female", "count": 1340 },
        { "label": "Prefer not to say", "count": 110 }
      ],
      "ageGroups": [
        { "label": "18–25", "count": 480 },
        { "label": "26–35", "count": 1340 },
        { "label": "36–45", "count": 1020 },
        { "label": "46–55", "count": 570 },
        { "label": "55+", "count": 250 }
      ],
      "maritalStatus": [
        { "label": "Single", "count": 1850 },
        { "label": "Married", "count": 1490 },
        { "label": "Divorced", "count": 210 },
        { "label": "Widowed", "count": 110 }
      ],
      "locations": [
        { "label": "Lagos", "count": 1420 },
        { "label": "Abuja", "count": 680 }
      ],
      "employmentStatus": [
        { "label": "Employed (Full-time)", "count": 1680 },
        { "label": "Self-employed", "count": 920 }
      ],
      "educationLevel": [
        { "label": "BSc / BA", "count": 1540 },
        { "label": "MSc / MBA", "count": 820 }
      ],
      "experienceLevel": [
        { "label": "Mid-level (3–7 yrs)", "count": 1290 },
        { "label": "Senior (7–15 yrs)", "count": 980 }
      ],
      "topOccupations": [
        { "label": "Software Engineer", "count": 480 },
        { "label": "Business Owner", "count": 420 }
      ]
    }
  }
}
```

#### Notes for Backend
- `registrationTrend` should return one entry per month, ordered oldest → newest, for the selected date range. If no date range is given, return the last 12 months.
- `howYouHeard` maps directly to the `howYouHearAboutUs` field on the User model.
- `topOccupations` should return the top 10 most common occupations, ordered by count descending.
- `locations` should return the top 10 locations (state or country from user address/country field), ordered by count descending.
- All demographic arrays should be filtered by `userStatus` if provided.
- Empty arrays `[]` are acceptable if no data matches. The frontend handles empty states gracefully.

---

## 2. Sales Analytics Page — `/analytics/sales`

### Filters available on this page
| Filter | URL Param | Type | Notes |
|--------|-----------|------|-------|
| Date Range | `start_date`, `end_date` | `String` (YYYY-MM-DD) | Optional |
| Asset Type | `assetType` | `String` | `"flex"` \| `"full-ownership"` |
| Location | `location` | `String` | Physical asset location name |

Filters cascade: when `assetType` is selected, the `location` dropdown should only show locations of that asset type. The frontend handles this — the backend just needs to filter by whatever params are passed.

---

### 2.1 KPI Cards — Top Metrics

> **Status: New query required.**

#### Query

```graphql
query GetSalesAnalyticsKpis($startDate: String, $endDate: String, $assetType: String, $location: String) {
  getSalesAnalyticsKpis(startDate: $startDate, endDate: $endDate, assetType: $assetType, location: $location) {
    totalSalesValue        # Total value of all sales (land price only)
    expectedAmount         # Total expected revenue (what should be paid in full)
    totalReceived          # Total amount actually received so far
    outstandingBalance     # expectedAmount - totalReceived
    sqmSold                # Total square metres sold across all assets
    uniqueBuyers           # Count of unique users who have purchased at least one asset
    uniqueSalesPersons     # Count of unique associates/sales persons who referred a sale
    completedPayments      # Number of users who have fully paid off their asset(s)
    paymentHealth {
      completed            # Count: fully paid
      gracePeriod          # Count: within grace period (not yet overdue)
      missedPayment        # Count: payment overdue but not yet defaulted
      defaulted            # Count: formally defaulted
      terminated           # Count: contract terminated
    }
    activeTransactions     # Total number of currently active transactions
  }
}
```

#### Expected Response Shape

```json
{
  "getSalesAnalyticsKpis": {
    "totalSalesValue": 485000000,
    "expectedAmount": 620000000,
    "totalReceived": 412000000,
    "outstandingBalance": 208000000,
    "sqmSold": 14500,
    "uniqueBuyers": 840,
    "uniqueSalesPersons": 310,
    "completedPayments": 215,
    "paymentHealth": {
      "completed": 215,
      "gracePeriod": 180,
      "missedPayment": 95,
      "defaulted": 42,
      "terminated": 18
    },
    "activeTransactions": 625
  }
}
```

---

### 2.2 Asset / Location Breakdown

> **Status: New query required.**

#### Query

```graphql
query GetSalesAssetBreakdown($startDate: String, $endDate: String, $assetType: String, $location: String) {
  getSalesAssetBreakdown(startDate: $startDate, endDate: $endDate, assetType: $assetType, location: $location) {
    location               # Physical location name e.g. "Lekki Phase 1"
    assetType              # "flex" or "full-ownership"
    assetName              # Full asset name
    expectedAmount         # Total expected from this asset
    totalReceived          # Total received so far
    outstandingBalance     # Expected - received
    sqmSold                # SQM sold for this asset
    totalBuyers            # Number of buyers for this asset
    paymentHealth {
      completed
      gracePeriod
      missedPayment
      defaulted
      terminated
    }
  }
}
```

#### Expected Response Shape

```json
{
  "getSalesAssetBreakdown": [
    {
      "location": "Lekki Phase 1",
      "assetType": "flex",
      "assetName": "Lekki Flex Plan A",
      "expectedAmount": 120000000,
      "totalReceived": 98000000,
      "outstandingBalance": 22000000,
      "sqmSold": 3200,
      "totalBuyers": 180,
      "paymentHealth": {
        "completed": 60,
        "gracePeriod": 45,
        "missedPayment": 30,
        "defaulted": 12,
        "terminated": 5
      }
    },
    {
      "location": "Lekki Phase 1",
      "assetType": "full-ownership",
      "assetName": "Lekki Full Ownership Plot",
      "expectedAmount": 85000000,
      "totalReceived": 75000000,
      "outstandingBalance": 10000000,
      "sqmSold": 1800,
      "totalBuyers": 65,
      "paymentHealth": {
        "completed": 40,
        "gracePeriod": 10,
        "missedPayment": 8,
        "defaulted": 5,
        "terminated": 2
      }
    }
  ]
}
```

#### Notes for Backend
- Return one entry per asset (not per location). Multiple assets can share the same location.
- The frontend groups them by `location` and then by `assetType` within that location.
- Order by `expectedAmount` descending so highest-value assets appear first.

---

### 2.3 Monthly Revenue Timeline

> **Status: New query required.**

#### Query

```graphql
query GetSalesMonthlyTimeline($startDate: String, $endDate: String, $assetType: String, $location: String) {
  getSalesMonthlyTimeline(startDate: $startDate, endDate: $endDate, assetType: $assetType, location: $location) {
    month                  # e.g. "Jan '25"
    expectedRevenue        # What should have been collected this month in total
    totalDue               # What was due (scheduled payments) this month specifically
    totalReceived          # What was actually received this month
    activeTransactions     # Number of active transactions at end of this month
    gracePeriodCount       # Users in grace period this month
    missedPaymentCount     # Users who missed payment this month
    defaultedCount         # Users who defaulted this month
  }
}
```

#### Expected Response Shape

```json
{
  "getSalesMonthlyTimeline": [
    {
      "month": "Apr '24",
      "expectedRevenue": 52000000,
      "totalDue": 18000000,
      "totalReceived": 15500000,
      "activeTransactions": 480,
      "gracePeriodCount": 32,
      "missedPaymentCount": 18,
      "defaultedCount": 4
    },
    {
      "month": "May '24",
      "expectedRevenue": 54000000,
      "totalDue": 19500000,
      "totalReceived": 17200000,
      "activeTransactions": 510,
      "gracePeriodCount": 28,
      "missedPaymentCount": 22,
      "defaultedCount": 6
    }
  ]
}
```

#### Notes for Backend
- Return one entry per month, ordered oldest → newest.
- If no date range is provided, return the last 12 months.
- `totalDue` = payments that were scheduled/due in that specific month (not cumulative).
- `expectedRevenue` = running total of what is expected from all active subscriptions as of that month.
- `missedPaymentCount` = users who had a payment due that month and did not pay (not including those already in grace).
- `defaultedCount` = users who crossed the default threshold in that specific month.

---

## 3. Shared — Available Locations Query

> **Status: New query required.** Used to populate the Location dropdown filter on the Sales Analytics page, and to cascade it based on Asset Type selection.

#### Query

```graphql
query GetAssetLocations($assetType: String) {
  getAssetLocations(assetType: $assetType) {
    location    # Physical location name
    assetType   # "flex" or "full-ownership"
  }
}
```

#### Expected Response Shape

```json
{
  "getAssetLocations": [
    { "location": "Lekki Phase 1", "assetType": "flex" },
    { "location": "Lekki Phase 1", "assetType": "full-ownership" },
    { "location": "Ibeju Lekki", "assetType": "flex" },
    { "location": "Epe", "assetType": "full-ownership" }
  ]
}
```

#### Notes for Backend
- When `assetType` is passed, return only locations that have assets of that type.
- When `assetType` is not passed, return all locations (with their type) so the frontend knows which type each location belongs to.
- Duplicate location names with different asset types are expected and correct.

---

## 4. Payment Status Definitions

The following status labels are used consistently across both pages. The backend should apply the same logic when categorising users/transactions:

| Status | Definition |
|--------|-----------|
| **Completed** | User has paid the full amount — `amount_paid >= amount_payable` |
| **Grace Period** | Payment is overdue but within the configured grace window (e.g. 1–7 days late) |
| **Missed Payment** | Payment is overdue beyond the grace window but the contract is still active |
| **Defaulted** | User has missed multiple payments and has been formally flagged as a default |
| **Terminated** | Contract has been terminated — user will not continue |

These map to the existing `default_status` field logic on the User model. Please confirm the exact thresholds for Grace Period vs Missed vs Defaulted so the frontend labels match backend logic.

---

---

## 3. Assets Page — `/assets` & `/assets/[type]/[id]`

This section covers both the main **assets list page** and the **individual asset detail page**. Some components already use real data — those are clearly marked. The rest are currently mocked and need real backend data.

---

### 3.1 What Already Works (Real Data — No Changes Needed)

| Query / Hook | Used By | Data Returned |
|---|---|---|
| `getAllAdminAssets(page, limit)` | Asset list tables | Asset rows with name, location, type, options |
| `getAssetInventoryData()` | `AssetInventoryOverview` cards | totalAssets, totalWorth, flex/fullOwnership counts & worth |
| `viewAssetByName(assetName, assetType)` | `AssetInventory` section on detail page | available_unit, unit_sold, expected_return, total_value, sizes |
| `viewAssetOptionDataByName(assetName, assetType)` | `AssetSizesInventory` on detail page | Per-size: units, value, units sold, expected returns |
| `ViewAsset(id)` | Edit forms | Full asset details for pre-filling forms |
| `ViewSubscribedCustomersOnAsset(...)` | `SubscribedCustomers` table on detail page | Full subscriber list + metrics |

---

### 3.2 Extend — `getAssetInventoryData`

> **Action: Extend existing query.** The query already exists and is called. The response object needs additional fields added to it.

**Currently returns:**
```graphql
totalAssets
totalWorth
totalFlexAssets
totalFlexWorth
totalFullOwnershipAssets
totalFullOwnershipWorth
```

**Add these fields to the existing response:**

```graphql
# Portfolio-wide metrics (for InventoryHealthBar component)
totalCapacitySqm          # Total SQM across all assets (available + sold)
activeCustomers           # Total customers with at least one active subscription
overallEfficiency         # Collection efficiency % across all assets (received / expected * 100)
totalValueSold            # Total value of sold units (sum of all land prices across all subscriptions)
totalSqmSold              # Total SQM sold across all assets
totalMoneyReceived        # Total amount actually collected across all subscriptions
totalBalanceOwed          # Total outstanding balance (expected - received)

# Portfolio-wide defaults (for InventoryHealthBar defaults section)
defaultingCustomers       # Count of users currently in default status
defaultedAssetValue       # Total land price value of defaulted subscriptions
amountPaidByDefaulters    # Total amount already paid by defaulting users
amountStillOwing          # Remaining balance owed by defaulting users

# Per-category breakdown (for AssetCategoryHealth cards)
flexCategory {
  activeAssetCount          # Number of active flex assets
  totalSqm                  # Total SQM across all flex assets
  grossRevenue              # Total expected revenue from all flex subscriptions
  collectionEfficiency      # % of expected flex revenue actually collected
  occupancyRate             # % of total flex units that are sold/subscribed
  totalValueSold            # Value of sold flex units
  totalSqmSold              # SQM sold across flex assets
  totalMoneyReceived        # Amount received from flex subscriptions
  totalBalance              # Outstanding balance on flex subscriptions
  defaultingCustomers       # Flex defaulting customer count
  defaultedAssetValue       # Value of defaulted flex subscriptions
  defaultersPaid            # Amount paid by flex defaulters
  defaultersOwing           # Amount still owed by flex defaulters
}
fullOwnershipCategory {
  # Same structure as flexCategory above
  activeAssetCount
  totalSqm
  grossRevenue
  collectionEfficiency
  occupancyRate
  totalValueSold
  totalSqmSold
  totalMoneyReceived
  totalBalance
  defaultingCustomers
  defaultedAssetValue
  defaultersPaid
  defaultersOwing
}
```

**Full extended response shape:**
```json
{
  "getAssetInventoryData": {
    "totalAssets": 20,
    "totalWorth": 8420000000,
    "totalFlexAssets": 12,
    "totalFlexWorth": 3200000000,
    "totalFullOwnershipAssets": 8,
    "totalFullOwnershipWorth": 5220000000,
    "totalCapacitySqm": 2100000,
    "activeCustomers": 3450,
    "overallEfficiency": 88.2,
    "totalValueSold": 5180000000,
    "totalSqmSold": 1240000,
    "totalMoneyReceived": 3910000000,
    "totalBalanceOwed": 1270000000,
    "defaultingCustomers": 127,
    "defaultedAssetValue": 680000000,
    "amountPaidByDefaulters": 294000000,
    "amountStillOwing": 386000000,
    "flexCategory": {
      "activeAssetCount": 12,
      "totalSqm": 450000,
      "grossRevenue": 320000000,
      "collectionEfficiency": 88,
      "occupancyRate": 92,
      "totalValueSold": 2940000000,
      "totalSqmSold": 720000,
      "totalMoneyReceived": 2310000000,
      "totalBalance": 630000000,
      "defaultingCustomers": 84,
      "defaultedAssetValue": 412000000,
      "defaultersPaid": 178000000,
      "defaultersOwing": 234000000
    },
    "fullOwnershipCategory": {
      "activeAssetCount": 8,
      "totalSqm": 1650000,
      "grossRevenue": 1100000000,
      "collectionEfficiency": 75,
      "occupancyRate": 81,
      "totalValueSold": 2240000000,
      "totalSqmSold": 520000,
      "totalMoneyReceived": 1600000000,
      "totalBalance": 640000000,
      "defaultingCustomers": 43,
      "defaultedAssetValue": 268000000,
      "defaultersPaid": 116000000,
      "defaultersOwing": 152000000
    }
  }
}
```

---

### 3.3 Extend — `getAllAdminAssets` (per-asset `collectionEfficiency`)

> **Action: Extend existing query.** Add one field to each asset object in the list response. Used by both `AssetFlexTable` and `AssetFullOwnershipTable` — currently hardcoded to 88%.

**Add to each asset in the data array:**
```graphql
collectionEfficiency   # Float 0–100. (totalMoneyReceived / expectedRevenue) * 100 for this asset
```

**Example per-asset object (with new field):**
```json
{
  "_id": "abc123",
  "asset_name": "Lekki Flex Plan A",
  "asset_location": "Lekki Phase 1",
  "asset_type": "flex",
  "asset_option": [...],
  "collectionEfficiency": 84.5
}
```

---

### 3.4 New Query — `getAssetHealthMetrics` (Asset Detail Page)

> **Action: New query required.** Powers the `AssetHealthBar` component on the asset detail page (`/assets/flex/[id]` and `/assets/fullownership/[id]`). Currently entirely mocked.

#### Query

```graphql
query GetAssetHealthMetrics($assetName: String!, $assetType: String!, $startDate: String, $endDate: String) {
  getAssetHealthMetrics(assetName: $assetName, assetType: $assetType, startDate: $startDate, endDate: $endDate) {

    # Portfolio Overview section
    startingInventoryValue    # Total value of all units in this asset if fully sold at full price
    totalRealized             # Value of all sold units (land price × units sold)
    soldPercentage            # (totalRealized / startingInventoryValue) * 100
    remainingValue            # startingInventoryValue - totalRealized
    sqmSold                   # Total SQM sold for this asset
    sqmRemaining              # Total SQM not yet sold
    portfolioEfficiency       # (moneyReceived / expectedFromSold) * 100

    # Defaults section
    defaultedCustomers        # Count of customers in default on this asset
    defaultedValue            # Total land price of defaulted subscriptions on this asset
    defaultedBalance          # Amount still owed by defaulters on this asset

    # Terminations section
    terminatedCustomers       # Count of terminated contracts on this asset
    terminatedValue           # Total land price of terminated subscriptions
    terminatedBalance         # Amount still owed at time of termination

    # Customer Health breakdown (for stacked bar)
    totalCustomers            # All subscribers on this asset
    activeCustomers           # Customers not defaulted or terminated
  }
}
```

#### Expected Response Shape

```json
{
  "getAssetHealthMetrics": {
    "startingInventoryValue": 2450000000,
    "totalRealized": 1120000000,
    "soldPercentage": 45.7,
    "remainingValue": 1330000000,
    "sqmSold": 84500,
    "sqmRemaining": 98200,
    "portfolioEfficiency": 84.2,
    "defaultedCustomers": 12,
    "defaultedValue": 284000000,
    "defaultedBalance": 118000000,
    "terminatedCustomers": 7,
    "terminatedValue": 196000000,
    "terminatedBalance": 74000000,
    "totalCustomers": 154,
    "activeCustomers": 135
  }
}
```

#### Notes for Backend
- `assetName` and `assetType` are the identifiers used throughout the app (not the `_id`) — this is consistent with how `viewAssetByName` is called.
- `startingInventoryValue` = total SQM of asset × price per SQM (the "maximum possible revenue" if every unit were sold at full price).
- `portfolioEfficiency` = money actually received ÷ money expected from all sold units. Not to be confused with occupancy (which is units sold ÷ total units).
- `defaultedCustomers` and `terminatedCustomers` are separate counts. The frontend renders them in separate colour-coded sections.
- The frontend derives `activeCustomers` for the stacked bar using `totalCustomers - defaultedCustomers - terminatedCustomers`. Alternatively, return `activeCustomers` directly.
- `startDate`/`endDate` filters should narrow which subscriptions are considered (e.g. only subscriptions started within the date range).

---

### 3.5 New Query — `getPaymentPlanPerformance` (Asset Detail Page)

> **Action: New query required.** Powers the `PaymentPlanMatrix` component on the asset detail page. Currently entirely mocked. This is the most detailed new query needed.

#### Query

```graphql
query GetPaymentPlanPerformance($assetName: String!, $assetType: String!, $startDate: String, $endDate: String) {
  getPaymentPlanPerformance(assetName: $assetName, assetType: $assetType, startDate: $startDate, endDate: $endDate) {
    sizeGroups {
      size              # e.g. "150 SQM", "300 SQM", "500 SQM"
      plans {
        name            # Plan name e.g. "Outright", "6 Months", "12 Months", "36 Months"
        startValue      # Total value if all units on this plan were sold
        soldValue       # Value of units actually sold on this plan
        sqmSold         # SQM sold under this plan
        sqmRemaining    # SQM not yet sold under this plan
        customers       # Number of active subscribers on this plan
        defaults {
          count         # Number of defaulters on this plan
          value         # Total land price of defaulted subscriptions on this plan
          balance       # Outstanding balance from defaulters on this plan
        }
        terminations {
          count         # Number of terminated contracts on this plan
          value         # Total land price of terminated subscriptions on this plan
          balance       # Outstanding balance at time of termination
        }
        efficiency      # Collection efficiency % for this specific plan
      }
    }
  }
}
```

#### Expected Response Shape

```json
{
  "getPaymentPlanPerformance": {
    "sizeGroups": [
      {
        "size": "150 SQM",
        "plans": [
          {
            "name": "Outright",
            "startValue": 150000000,
            "soldValue": 120000000,
            "sqmSold": 1800,
            "sqmRemaining": 1200,
            "customers": 12,
            "defaults": { "count": 0, "value": 0, "balance": 0 },
            "terminations": { "count": 0, "value": 0, "balance": 0 },
            "efficiency": 100
          },
          {
            "name": "6 Months",
            "startValue": 175000000,
            "soldValue": 80000000,
            "sqmSold": 2100,
            "sqmRemaining": 3900,
            "customers": 24,
            "defaults": { "count": 2, "value": 14600000, "balance": 6200000 },
            "terminations": { "count": 1, "value": 7300000, "balance": 2800000 },
            "efficiency": 91
          },
          {
            "name": "12 Months",
            "startValue": 200000000,
            "soldValue": 45000000,
            "sqmSold": 1050,
            "sqmRemaining": 600,
            "customers": 30,
            "defaults": { "count": 5, "value": 38000000, "balance": 16400000 },
            "terminations": { "count": 3, "value": 22000000, "balance": 9100000 },
            "efficiency": 78
          }
        ]
      },
      {
        "size": "300 SQM",
        "plans": [...]
      }
    ]
  }
}
```

#### Notes for Backend
- Group plans by the `size` field on `asset_option`. Each size may have multiple payment plans.
- `name` should match the plan's `duration_months` in a human-readable format: `0` → `"Outright"`, `6` → `"6 Months"`, `12` → `"12 Months"`, etc.
- `startValue` = total units allocated to this plan × plan price per unit.
- `soldValue` = total land price of subscriptions currently on this plan (active + defaulted + terminated).
- `efficiency` = amount received from this plan's subscribers ÷ amount expected × 100.
- The frontend aggregates size-level totals from the plans array on the client side (sum of all plans in a size group). No need to return pre-aggregated size totals.
- Return `[]` for `sizeGroups` if no data exists — the table handles empty state.

---

## 4. Summary of All Required Backend Changes

### New Queries
| Query | Used By | Priority |
|-------|---------|----------|
| `getUserAnalytics` | User Analytics page | High |
| `getSalesAnalyticsKpis` | Sales Analytics page | High |
| `getSalesAssetBreakdown` | Sales Analytics page | High |
| `getSalesMonthlyTimeline` | Sales Analytics page | High |
| `getAssetLocations` | Sales Analytics filter | Medium |
| `getAssetHealthMetrics` | Asset detail page | High |
| `getPaymentPlanPerformance` | Asset detail page | High |

### Extended Queries (add fields to existing response)
| Query | What to Add | Priority |
|-------|------------|----------|
| `getAssetInventoryData` | Portfolio health metrics + per-category breakdown | High |
| `getAllAdminAssets` | `collectionEfficiency` per asset | Medium |

### No Changes Needed (already working)
| Query | Status |
|-------|--------|
| `getSystemUsersOverview` | ✅ Used for User Analytics conversion section |
| `getSalesDashboard` | ✅ Used for existing sales summary cards |
| `viewAssetByName` | ✅ Used for asset detail inventory section |
| `viewAssetOptionDataByName` | ✅ Used for per-size inventory cards |
| `ViewAsset` | ✅ Used for edit forms |
| `ViewSubscribedCustomersOnAsset` | ✅ Used for subscriber table |

## 5. Payment Status Definitions (Applies to All Pages)

The following status labels are used consistently across all pages. The backend should apply the same logic when categorising users/transactions:

| Status | Definition |
|--------|-----------|
| **Completed** | User has paid the full amount — `amount_paid >= amount_payable` |
| **Grace Period** | Payment is overdue but within the configured grace window (e.g. 1–7 days late) |
| **Missed Payment** | Payment is overdue beyond the grace window but the contract is still active |
| **Defaulted** | User has missed multiple payments and has been formally flagged as a default |
| **Terminated** | Contract has been terminated — user will not continue |

Please confirm the exact day thresholds for Grace Period → Missed → Defaulted so frontend labels match backend logic.
