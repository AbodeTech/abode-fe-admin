/**
 * FLEX Manager Dashboard — shape contract with the BE.
 * Hand-authored while BE ticket is in flight
 * (guidelines/Flex_Manager_Dashboard.md). Swap consumers over to
 * codegen types in @/lib/gql/graphql once the schema ships.
 *
 * Single-holder role: only one admin holds "FLEX Manager" at a time.
 * The dashboard reflects the CURRENT holder + current period; historical
 * records are stored in the DB but not surfaced in v1.
 */

export type FlexManagerPeriodType = "MONTH" | "YEAR" | "WEEK" | "CUSTOM";

export interface FlexManagerPeriod {
  periodType: FlexManagerPeriodType;
  month: number | null;
  year: number | null;
  start: string;
  end: string;
}

/** Matches the BE `Admin` type surfaced on FlexManagerDashboardResponse.
 * Note: unlike the associate-managers path (ManagerAdminInfo), the base
 * Admin type doesn't ship firstName/lastName — display falls back to
 * userName then email. When BE extends Admin (or we switch this to
 * ManagerAdminInfo), drop the fallback chain. */
export interface FlexManagerAdminUser {
  _id: string;
  userName: string;
  email: string;
  role: string;
}

/** The `getFlexManager` singleton — current holder + when they took over. */
export interface FlexManagerHolder {
  manager: FlexManagerAdminUser;
  assignedFrom: string;
}

export interface FlexManagerTarget {
  newCustomersTarget: number;
  newCustomersSoFar: number;

  newSalesValueTarget: number;
  newSalesValueSoFar: number;

  recurringTarget: number;
  recurringSoFar: number;
  /** System-computed sum of what's due this period across all active
   * Flex plans. Compared against recurringSoFar to surface a collection
   * gap when the FM hasn't collected everything scheduled. */
  recurringExpected: number;
}

export interface FlexManagerPerformanceScore {
  score: number;               // 0-100
  newCustomersComponent: number; // max 50
  newSalesComponent: number;   // max 30
  recurringComponent: number;  // max 20
}

export interface FlexManagerDashboard {
  period: FlexManagerPeriod;
  /** Null when the role is currently unassigned — FE renders an empty
   * state / assign CTA rather than the KPIs. */
  manager: FlexManagerAdminUser | null;
  target: FlexManagerTarget;
  performanceScore: FlexManagerPerformanceScore;
}

/** Persisted target record — matches BE FlexManagerTargetType. */
export interface FlexManagerTargetRecord {
  _id: string;
  manager: string; // Admin id
  month: number;
  year: number;
  new_customers_target: number;
  new_sales_value_target: number;
  recurring_target: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Assignment audit row — matches BE FlexManagerAssignmentType. */
export interface FlexManagerAssignmentRecord {
  _id: string;
  manager: string;
  assigned_from: string;
  assigned_to: string | null;
  created_by: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}
