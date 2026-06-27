# Manager Performance — Drill-downs, Sort & Export

Build spec for the next round of work on `/associates/managers` and `/associates/performance`. One BE list, one FE list; the two teams can work in parallel after §2.1 lands.

**Repo paths used in this doc:**
- BE: `/Users/user/projects/work/abode/abode-BE` (relative paths below are from its root)
- FE: this repo, `abode-admin-fe` (relative paths from its root)

---

## 1. The problem

The dashboards (`getAdminManagerDashboard`, `managerDashboard`, `getAllManagersDashboard`, `getSystemAssociatesDashboard`) show **how many** Pros recruited, sold, or got onboarded — but never **who**. An admin can't:

- See the 8 Pros they just recruited but haven't onboarded yet (the onboarding queue)
- Click "Selling Pros: 75" and see the 75 people who actually closed sales this period
- Sort the roster by who was recruited most recently
- Download any of this to a CSV

This spec fixes those three gaps.

---

## 2. Backend tasks (`abode-BE`)

### 2.1 Add `proGroup` and `proSort` to the dashboard filter

**Files to edit:**

- `src/schema/adminTypeDefs.ts` — add the new enums and extend `ManagerDashboardFilterInput`. Find the existing `input ManagerDashboardFilterInput { ... }` block (search for "ManagerDashboardFilterInput") and add the two new fields.
- `src/services/admin/manager/dashboardService.ts` (762 lines, the file is laid out as: types → `buildDashboard` (L92) → `buildAllManagersDashboard` (L147) → `buildSystemAssociatesDashboard` → `computeDashboard` (L191) → service object at the bottom).

**The roster filtering + sorting code lives in one place: `computeDashboard`.** All four dashboard queries delegate to it (line 116, 136, 186). The roster slicing for pagination is around L626–630 — sort/filter must happen **before** that slice.

**Schema (add to `src/schema/adminTypeDefs.ts`):**

```graphql
input ManagerDashboardFilterInput {
  # existing
  periodType: PeriodType
  month: Int
  year: Int
  startDate: Date
  endDate: Date

  # NEW
  proGroup: ProRosterGroup     # narrows associatePros; defaults to `all`
  proSort: ProRosterSort       # orders associatePros; default depends on group (see below)
}

enum ProRosterGroup {
  all
  recruited_in_period           # joined the roster during the period
  upgraded_in_period            # downline recruits who became associate-pros in period
  onboarded_in_period           # Picked OnboardingAttempt logged in period
  selling_in_period             # closed an initial sale in period
  recent_login                  # last_login within last 90 days
  recent_sale                   # group sale within last 90 days
  recent_recruit                # caused an approved recruit within last 90 days
  recruited_not_onboarded       # roster member with no Picked OnboardingAttempt ever
  active
  inactive
  abandoned
}

enum ProRosterSort {
  date_recruited_desc
  date_recruited_asc
  last_login_desc
  last_login_asc
  total_sales_desc
  revenue_desc
  onboarded_at_desc
  onboarded_at_asc
}
```

**Implementation steps inside `computeDashboard`:**

1. Add `proGroup` and `proSort` to the function's filter/options parameter.
2. After the per-pro metric loop builds `associateProsList`, before the pagination slice, filter by `proGroup` then sort by `proSort`.
3. Capture `associateProsList.length` AFTER the group filter but BEFORE the page slice — that's the new `associateProsGroupTotal` (§2.2).

**Reference for the `recruited_not_onboarded` check:** read `OnboardingAttempt` documents where `outcome: "picked"`. The repository function already exists: `getFirstPickedAttempt(proId)` in `src/repository/onboardingAttemptRepository.ts`. For efficiency, do a single bulk query at the top of `computeDashboard`:

```ts
const pickedProIds = new Set(
  (await onboardingAttemptModel
    .find({ pro: { $in: proIds }, outcome: "picked" })
    .select("pro")
    .lean()).map((a) => a.pro.toString())
);
// later in the filter:
case "recruited_not_onboarded":
  return !pickedProIds.has(pro._id.toString());
```

**Defaulting `proSort`:**

```ts
const defaultSort = (group?: ProRosterGroup): ProRosterSort => {
  switch (group) {
    case "recruited_in_period":
    case "upgraded_in_period":
    case "recruited_not_onboarded":
      return "date_recruited_desc";
    default:
      return "total_sales_desc";
  }
};
```

**Rules:**

- `proGroup` narrows **only** `associatePros`. Aggregate counts (`recruitment.*`, `salesAndRevenue.*`, `activity.*`, `milestones.*`, `recruitment.totalAssigned`) stay computed on the full roster.
- `recruited_not_onboarded` excludes any Pro with a Picked `OnboardingAttempt` — even if logged before the period.

**How to verify:**

- Run the dashboard query in Apollo studio with `filter: { proGroup: recruited_not_onboarded }` — `associatePros` should only contain Pros with no Picked attempt; `recruitment.totalAssigned` should be unchanged.
- With no `proGroup`, the response should be identical to today's.

### 2.2 Add `associateProsGroupTotal` and `onboardingQueueCount` to the response

**File:** `src/schema/adminTypeDefs.ts`. Find `type ManagerDashboardResponse` and `type ManagerDashboardRecruitment`.

```graphql
type ManagerDashboardResponse {
  # ... existing fields
  associatePros: [ManagerDashboardProRow!]!
  associateProsGroupTotal: Int!   # NEW — count matching the active proGroup
  recruitment: ManagerDashboardRecruitment!
}

type ManagerDashboardRecruitment {
  newSignupsInPeriod: Int!
  upgradesInPeriod: Int!
  onboardedInPeriod: Int!
  onboardingQueueCount: Int!      # NEW — roster members with no Picked attempt ever (period-independent)
  totalAssigned: Int!
}
```

**Service:** in `computeDashboard`, compute and return both values:

- `associateProsGroupTotal` = length of the group-filtered list (post-filter, pre-slice). When `proGroup` is `all` it equals `totalAssigned`.
- `onboardingQueueCount` = roster members with no Picked attempt, regardless of period. Use the `pickedProIds` Set from §2.1: `proIds.filter((id) => !pickedProIds.has(id)).length`.

**How to verify:**

- Query the dashboard with `proGroup: upgraded_in_period`. `associateProsGroupTotal` should equal `recruitment.upgradesInPeriod`.
- `recruitment.onboardingQueueCount` should NOT change when you change the period filter (it's period-independent).

### 2.3 Add export queries

**File:** `src/services/admin/manager/dashboardService.ts` for the service methods; `src/schema/adminTypeDefs.ts` for the schema; `src/resolvers/adminResolver.ts` for the resolver wiring (existing dashboard resolvers are at lines 3288, 3305, 3325, 3346 — drop the new ones next to them).

**Schema:**

```graphql
extend type Query {
  exportManagerDashboardPros(
    managerId: ID                   # null + caller is super admin → "all managers" combined view
    associateTier: Boolean          # true → system associates roster (super admin only)
    filter: ManagerDashboardFilterInput
  ): [ManagerDashboardProRow!]!

  exportManagerSalesRecord(
    managerId: ID                   # null = caller's own roster
    filters: SalesRecordFilters
  ): [SalesRecord!]!
}
```

**Service:** both methods honour `proGroup` and `proSort` (and `filters` for sales). The simplest implementation calls the existing pipeline with `pagination: undefined` so it returns the full list, then truncates.

**Auth pattern — copy from `src/services/admin/associateManager/onboardingService.ts:48–65`** (the `ensureCanActOnPro` helper). Adapt:

```ts
const ensureCanExport = async (
  admin: any,
  argManagerId: string | null,
  associateTier: boolean
) => {
  // Super admin can export anything
  if (admin.role === "admin") return;

  // Non-super-admin cannot view the system associates tier
  if (associateTier) {
    throw new AuthenticationError(
      "Only super admins can export system associate data"
    );
  }
  // Non-super-admin manager: argManagerId must be their own (or null)
  if (argManagerId && argManagerId !== admin._id.toString()) {
    throw new AuthenticationError(
      "Managers can only export their own roster"
    );
  }
};
```

**5,000-row cap:**

```ts
const EXPORT_ROW_LIMIT = 5000;
if (rows.length > EXPORT_ROW_LIMIT) {
  throw new ApolloError(
    "Too many rows to export — narrow your date range or apply a filter."
  );
}
return rows;
```

Use the same imports already at the top of `dashboardService.ts` (`ApolloError` from `apollo-server-errors`, `AuthenticationError` already in scope via the existing services).

**How to verify:**

- Run `exportManagerDashboardPros(managerId: "...", filter: { proGroup: selling_in_period })`. Should return ALL selling pros, no pagination, in `date_recruited_desc` order (default sort for non-newness groups → `total_sales_desc`).
- Same query as a non-super-admin manager with a different `managerId` should throw `AuthenticationError`.
- Manually `await Promise.all([…])` to insert 5,001 fake rows and confirm the cap fires the right error message.

### 2.4 BE acceptance checklist

- [ ] `ManagerDashboardFilterInput` accepts `proGroup` and `proSort`; old callers without them get current behaviour.
- [ ] All four dashboard queries apply `proGroup` / `proSort` to `associatePros` only.
- [ ] `associateProsGroupTotal` returned on every dashboard response.
- [ ] `onboardingQueueCount` returned inside `recruitment`.
- [ ] `exportManagerDashboardPros` returns the full unpaginated set, honours `proGroup` + `proSort`, capped at 5,000.
- [ ] `exportManagerSalesRecord` returns the full unpaginated set, honours `filters`, capped at 5,000.
- [ ] Auth enforced: non-super-admin managers can only export their own data; cannot use `associateTier: true`.

---

## 3. Frontend tasks (`abode-admin-fe`)

**Build order:** §3.2 first (smallest, no BE dependency for sort — it currently has no sort), §3.1 next (depends on §2.1, §2.2), §3.3 last (depends on §2.3).

After every change run:
```
npm run codegen && npx tsc --noEmit && npm run build
```
If codegen errors complain about missing operations, you have a stale gql overload — re-run `npm run codegen`.

### 3.0 Reference patterns already in the codebase

Bookmark these — copy their shape, don't reinvent:

| Pattern | Reference file |
|---|---|
| GraphQL query hook | `features/associate-managers/hooks/use-manager-dashboard.ts` |
| GraphQL mutation hook | `features/associate-managers/hooks/use-log-onboarding-attempt.ts` |
| URL state via `useSearchParams` + `router.push` | `components/shared/DateFilter.tsx:30–82` |
| CSV download (json2csv + file-saver) | `features/sales/hooks/use-sales-export.ts` |
| Cross-feature import (with comment flag) | `features/associate-managers/hooks/use-team-sales.ts:7` |
| Pros-table column layout (the columns the drawer will reuse) | `features/associate-managers/components/AssociateProsTable.tsx:264–315` |

`shadcn Sheet` is **not yet installed**. Run this once before §3.1:

```
npx shadcn@latest add sheet
```

That writes `components/ui/sheet.tsx`. After that you can `import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"`.

### 3.1 Click a KPI → open a Group Drawer with the people

The drill-down lives in a **side drawer** (shadcn `Sheet`), not the main page. Reason: there are 4 sections between the KPIs and the Pros table, so auto-scrolling past them after every click is jarring. A drawer keeps the dashboard in place behind it and lets the user click another KPI to swap groups instantly.

**New files:**

- `features/associate-managers/hooks/use-dashboard-pros-group.ts`
- `features/associate-managers/components/ProGroupDrawer.tsx`

**Hook signature** (`use-dashboard-pros-group.ts`):

```ts
import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { ManagerDashboardFilterInput, ProRosterGroup, ProRosterSort } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

// One light-weight query that ONLY pulls the roster + group total. Reuses
// the same four endpoints we already have — just sets proGroup + proSort.
// Branches at runtime by viewContext.

interface Params {
  viewContext: "manager" | "all-managers" | "system-associates";
  managerId: string | null;       // required when viewContext === "manager"
  filter: ManagerDashboardFilterInput | null;
  group: ProRosterGroup;
  sort?: ProRosterSort;
  page: number;
  enabled?: boolean;
}

export const useDashboardProsGroup = (params: Params) => {
  // For each viewContext, set the right query — body shape only includes the
  // roster + total to keep payload tiny. Pattern: see use-manager-dashboard.ts
  // for the full body; here we slim it down.
  // ...
};
```

To keep payload small, request **only** these fields in the query: `associateProsGroupTotal`, `associatePros { ...row fields... }`. Don't re-fetch the full dashboard.

**Drawer component skeleton** (`ProGroupDrawer.tsx`):

```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { ProRosterGroup, ProRosterSort, ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { useDashboardProsGroup } from "../hooks/use-dashboard-pros-group";
import { useExportPros } from "../hooks/use-export-pros"; // see §3.2

const GROUP_LABELS: Record<ProRosterGroup, string> = {
  all: "All Pros",
  recruited_in_period: "Recruits this period",
  upgraded_in_period: "Recruits promoted to Associate Pro",
  onboarded_in_period: "Onboarded this period",
  selling_in_period: "Selling Pros",
  recent_login: "Logged in recently",
  recent_sale: "Sold recently",
  recent_recruit: "Recruited someone recently",
  recruited_not_onboarded: "Onboarding queue",
  active: "Active",
  inactive: "Inactive",
  abandoned: "Abandoned",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ProRosterGroup;
  sort: ProRosterSort | undefined;
  page: number;
  onSortChange: (s: ProRosterSort) => void;
  onPageChange: (p: number) => void;
  managerId: string | null;
  viewContext: "manager" | "all-managers" | "system-associates";
  filter: ManagerDashboardFilterInput | null;
}

export function ProGroupDrawer(props: Props) {
  const query = useDashboardProsGroup({ /* ...wire props... */ });
  const exportMutation = useExportPros();

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {GROUP_LABELS[props.group]} · {query.data?.total ?? 0}
          </SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-between gap-2 mt-4">
          <SortDropdown value={props.sort} onChange={props.onSortChange} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate({ /* ...wire... */ })}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export CSV
          </Button>
        </div>

        {/* Reuse the row markup from AssociateProsTable, no row actions */}
        {/* Pagination at the bottom — local prev/next, see TeamSalesSection for the pattern */}
      </SheetContent>
    </Sheet>
  );
}
```

**Wire up the drawer on the page** ([`app/(dashboard)/associates/managers/page.tsx`](../app/(dashboard)/associates/managers/page.tsx)):

```tsx
// At the top of the page component, alongside other useSearchParams reads
const openGroup = searchParams.get("openGroup") as ProRosterGroup | null;
const groupSort = searchParams.get("groupSort") as ProRosterSort | null;
const groupPage = Number(searchParams.get("groupPage")) || 1;

const setGroup = (g: ProRosterGroup | null) => {
  const params = new URLSearchParams(searchParams.toString());
  if (g) {
    params.set("openGroup", g);
  } else {
    params.delete("openGroup");
    params.delete("groupSort");
    params.delete("groupPage");
  }
  router.push(`?${params.toString()}`, { scroll: false });
};

// Then at the bottom of the JSX:
<ProGroupDrawer
  open={!!openGroup}
  onOpenChange={(open) => { if (!open) setGroup(null); }}
  group={openGroup ?? "all"}
  sort={groupSort ?? undefined}
  page={groupPage}
  onSortChange={/* update ?groupSort */}
  onPageChange={/* update ?groupPage */}
  managerId={activeManagerId}
  viewContext={isAllManagers ? "all-managers" : "manager"}
  filter={filter}
/>
```

(For the [`/associates/performance` page](../app/(dashboard)/associates/performance/page.tsx), `viewContext: "system-associates"` and `managerId: null`.)

**Make StatCards clickable.** Open [`features/associate-managers/components/StatCard.tsx`](../features/associate-managers/components/StatCard.tsx) and extend the props:

```tsx
interface StatCardProps {
  // ...existing
  onClick?: () => void;
}

// In the render:
<div
  onClick={onClick}
  className={cn(
    "bg-white rounded-xl p-6 border border-gray-200 transition-shadow",
    onClick && "cursor-pointer hover:shadow-md hover:border-gray-300"
  )}
>
  {/* existing content */}
  {onClick && <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-gray-400" />}
</div>
```

Then in each section (`RecruitmentSection`, `SalesRevenueSection`, `ActivitySection`, `MilestonesSection`), add a new prop `onOpenGroup?: (group: ProRosterGroup) => void` and pass `onClick={() => onOpenGroup?.("recruited_in_period")}` etc. The page wires `onOpenGroup={setGroup}`.

**Card → group map** (the table the page wires up):

| Card | `group` value |
|---|---|
| New Recruits This Period | `recruited_in_period` |
| Recruits Promoted to Associate Pro | `upgraded_in_period` |
| Onboarded This Period | `onboarded_in_period` |
| **Onboarding Queue** (NEW tile in Recruitment section) | `recruited_not_onboarded` |
| Total Pros Assigned | `all` |
| Selling Associate Pros | `selling_in_period` |
| Active Associate Pros | `active` |
| Inactive Associate Pros | `inactive` |
| Abandoned Associate Pros | `abandoned` |
| New Associate Pro First Sales | `selling_in_period` |

Total Revenue and Revenue per Selling Pro stay non-clickable — they don't map to a group of people.

**New "Onboarding Queue" KPI tile.** In `RecruitmentSection`, add a `StatCard` driven by `recruitment.onboardingQueueCount`. Place it as the second card. Use amber styling when count > 0 (`iconColor="text-amber-600" iconBg="bg-amber-50"`), neutral when 0. Label: "Onboarding Queue". Hint: "Recruited but no onboarding call logged yet."

**How to verify §3.1:**

- Reload `/associates/managers` with `?openGroup=recruited_not_onboarded` — drawer opens with that group preselected.
- Click "New Recruits This Period" card — drawer opens, header reads "Recruits this period · {count}", URL updates.
- Click "Onboarding Queue" tile — drawer opens with the right list.
- Close drawer (click backdrop or X) — URL params `openGroup`, `groupSort`, `groupPage` are all removed.
- Switch period filter while drawer is open — drawer refetches with the new date range.

### 3.2 Sort columns + CSV export on the bottom Pros table

**Where:** [`AssociateProsTable`](../features/associate-managers/components/AssociateProsTable.tsx) and [`SystemAssociatesTable`](../features/associate-managers/components/SystemAssociatesTable.tsx).

**Step 1 — pass `proSort` from URL through the existing dashboard hooks.**

Open [`features/associate-managers/hooks/use-manager-dashboard.ts`](../features/associate-managers/hooks/use-manager-dashboard.ts) and extend the filter inputs. The query already passes a `filter: ManagerDashboardFilterInput` — no shape change needed, just make sure the page's filter builder includes the URL-derived `proSort`. Same for `use-all-managers-dashboard.ts` and `use-system-associates-dashboard.ts`.

**Step 2 — make column headers sortable.**

Build a small helper at the top of each table component:

```tsx
"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

type SortableCol = "date_recruited" | "last_login" | "total_sales" | "revenue";

interface SortableHeadProps {
  col: SortableCol;
  active: ProRosterSort | null;
  onChange: (next: ProRosterSort) => void;
  children: React.ReactNode;
}

function SortableHead({ col, active, onChange, children }: SortableHeadProps) {
  // Maps a column to its two sort keys
  const [descKey, ascKey] = {
    date_recruited: ["date_recruited_desc", "date_recruited_asc"],
    last_login:     ["last_login_desc",     "last_login_asc"],
    total_sales:    ["total_sales_desc",    "revenue_desc"],   // total_sales has no asc; pair adjusts as needed
    revenue:        ["revenue_desc",        "revenue_desc"],
  }[col] as [ProRosterSort, ProRosterSort];

  const isActive = active === descKey || active === ascKey;
  const isDesc   = active === descKey;
  const next     = !isActive ? descKey : isDesc ? ascKey : descKey;

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="inline-flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
    >
      {children}
      {!isActive
        ? <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
        : isDesc
          ? <ChevronDown className="h-3.5 w-3.5" />
          : <ChevronUp className="h-3.5 w-3.5" />}
    </button>
  );
}
```

Wrap each sortable `<TableHead>` content with `<SortableHead col="date_recruited" active={proSort} onChange={setProSort}>Date Recruited</SortableHead>`. `proSort` and `setProSort` come from the URL — read with `useSearchParams`, write via `router.push` (see [`DateFilter.tsx:30–82`](../components/shared/DateFilter.tsx) for the exact pattern).

**Step 3 — Export CSV button.**

Add a hook `features/associate-managers/hooks/use-export-pros.ts`. Model it on [`features/sales/hooks/use-sales-export.ts`](../features/sales/hooks/use-sales-export.ts):

```ts
import { useMutation } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
// @ts-ignore — same in use-sales-export.ts
import { Parser } from "json2csv";
import { saveAs } from "file-saver";
import type { ManagerDashboardFilterInput, ProRosterGroup, ProRosterSort } from "@/lib/gql/graphql";

const EXPORT_PROS_QUERY = graphql(`
  query ExportManagerDashboardPros(
    $managerId: ID
    $associateTier: Boolean
    $filter: ManagerDashboardFilterInput
  ) {
    exportManagerDashboardPros(
      managerId: $managerId
      associateTier: $associateTier
      filter: $filter
    ) {
      firstName
      lastName
      email
      phoneNumber
      status
      dateRecruited
      onboardedAt
      totalSales
      revenueGenerated
      lastLogin
    }
  }
`);

interface Args {
  managerId: string | null;
  associateTier?: boolean;
  filter: ManagerDashboardFilterInput | null;
  filenameHint: string; // e.g. "all-managers" | manager.firstName + "-" + lastName
}

const CSV_FIELDS = [
  { label: "First Name",        value: "firstName" },
  { label: "Last Name",         value: "lastName" },
  { label: "Email",             value: "email" },
  { label: "Phone",             value: "phoneNumber" },
  { label: "Status",            value: "status" },
  { label: "Date Recruited",    value: "dateRecruited" },
  { label: "Onboarded At",      value: "onboardedAt" },
  { label: "Total Sales",       value: "totalSales" },
  { label: "Revenue Generated", value: "revenueGenerated" },
  { label: "Last Login",        value: "lastLogin" },
];

export const useExportPros = () =>
  useMutation({
    mutationFn: async (args: Args) => {
      const data = await execute(EXPORT_PROS_QUERY, {
        managerId: args.managerId,
        associateTier: args.associateTier,
        filter: args.filter,
      });
      const rows = data.exportManagerDashboardPros ?? [];
      const csv = new Parser({ fields: CSV_FIELDS }).parse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const today = new Date().toISOString().slice(0, 10);
      saveAs(blob, `pros-${args.filenameHint}-${today}.csv`);
    },
  });
```

In each table component, add the button in the header bar (next to the search input or above the table):

```tsx
import { Download, Loader2 } from "lucide-react";

const exportMutation = useExportPros();

<Button
  variant="outline"
  size="sm"
  onClick={() => exportMutation.mutate({
    managerId,
    filter: { ...filter, proSort },
    filenameHint: activeManagerName ?? "all-managers",
  })}
  disabled={exportMutation.isPending}
>
  {exportMutation.isPending
    ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    : <Download className="h-4 w-4 mr-2" />}
  Export CSV
</Button>
```

On the 5,000-row cap error from BE, surface a toast:

```tsx
useMutation({
  // ...
  onError: (err) => {
    toast.error((err as Error).message);
  },
});
```

The bottom table does **not** get group chips. Group filtering is the drawer's job. The bottom table is for browsing the full roster.

**How to verify §3.2:**

- Click "Date Recruited" header — chevron flips, URL updates to `?proSort=date_recruited_desc`, rows re-order.
- Click again — chevron flips up, URL = `?proSort=date_recruited_asc`.
- Click "Total Sales" — chevron moves there, prior column's chevron returns to neutral.
- Click "Export CSV" — downloaded file is named `pros-<manager-name>-2026-06-16.csv`, opens in Numbers/Excel with the 10 columns above. Order matches the on-screen sort.
- Apply a date filter that returns >5,000 rows — toast appears: "Too many rows to export — narrow your date range or apply a filter."

### 3.3 CSV export on the Team Sales table

**Where:** [`TeamSalesSection`](../features/associate-managers/components/TeamSalesSection.tsx).

**New hook:** `features/associate-managers/hooks/use-export-team-sales.ts`. Same shape as `useExportPros` above but calls `exportManagerSalesRecord` and uses sales columns. Filename: `team-sales-${managerNameOrAll}-${YYYY-MM-DD}.csv`.

**CSV columns:**

```ts
const CSV_FIELDS = [
  { label: "Buyer First Name", value: "user_firstName" },
  { label: "Buyer Last Name",  value: "user_lastName" },
  { label: "Buyer Email",      value: "email" },
  { label: "Buyer Phone",      value: "user_phone" },
  { label: "Referrer Name",    value: "referrer_name" },
  { label: "Referrer Email",   value: "referrer_email" },
  { label: "Referrer Phone",   value: "referrer_phone" },
  { label: "Asset Name",       value: "asset_name" },
  { label: "Asset Type",       value: "asset_type" },
  { label: "Units",            value: "no_of_units" },
  { label: "Size",             value: "size" },
  { label: "Price",            value: "price" },
  { label: "Amount Paid",      value: "amount_paid" },
  { label: "Amount Payable",   value: "amount_payable" },
  { label: "Balance",          value: "balance" },
  { label: "Default Amount",   value: "default_amount" },
  { label: "Suspended",        value: "is_suspended" },
  { label: "Start Date",       value: "start_date" },
  { label: "Next Payment Date", value: "next_date" },
];
```

Render the button next to the existing search input in `TeamSalesSection` (same Button code as §3.2).

**How to verify §3.3:**

- Click "Export CSV" on Team Sales — file downloads with 19 columns matching the on-screen rows. Filter the date range, click again — the CSV contains only the filtered rows.

### 3.4 FE acceptance checklist

- [ ] `components/ui/sheet.tsx` exists (added via `npx shadcn@latest add sheet`).
- [ ] Bottom Pros table has sortable column headers with chevron indicators. URL: `?proSort=...`.
- [ ] Bottom Pros table has an "Export CSV" button respecting current sort + date filter.
- [ ] System Associates table has sortable columns + "Export CSV".
- [ ] Team Sales table has "Export CSV".
- [ ] All CSV filenames include manager name (or "all-managers" / "all-associates") and today's date.
- [ ] 5,000-row cap surfaces the BE's error message in a toast.
- [ ] New "Onboarding Queue" StatCard rendered in Recruitment section (amber when count > 0).
- [ ] Each clickable KPI card opens the Group Drawer with the correct group preselected.
- [ ] Drawer is URL-driven: `?openGroup=...&groupSort=...&groupPage=...`. Refreshing the page with those params reopens the drawer in the same state.
- [ ] Drawer's "Export CSV" works the same way as the bottom table's.
- [ ] `npm run codegen && npx tsc --noEmit && npm run build` all clean before opening a PR.

---

## 4. Work order + estimates

```
BE                             FE
────────────────────────────   ─────────────────────────────────────────
                               §3.2 sortable headers (can start day 1, no BE dep)
§2.1 proGroup + proSort
§2.2 group total + queue
                               §3.1 drawer + Onboarding Queue tile (depends on §2.1, §2.2)
§2.3 export endpoints          §3.3 sales export hook + button (depends on §2.3)
                               §3.2 export hook + button (depends on §2.3)
```

**Critical path:** §2.1 + §2.2 unblock the drawer (§3.1). §2.3 unblocks all the CSV buttons.

Estimate per slice, one dev each:

- BE §2.1 + §2.2: 1 day
- BE §2.3: half a day
- FE §3.2 sortable headers: half a day
- FE §3.1 drawer + Onboarding Queue tile: 1.5 days
- FE §3.3 + §3.2 export buttons: 1 day

**Total: ~3 days end-to-end** with both devs working in parallel.
