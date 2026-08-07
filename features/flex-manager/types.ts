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

export interface FlexManagerAdmin {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
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
  manager: FlexManagerAdmin | null;
  target: FlexManagerTarget;
  performanceScore: FlexManagerPerformanceScore;
}
