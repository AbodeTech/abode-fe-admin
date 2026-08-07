/**
 * CS Manager Dashboard — shape contract with the BE.
 * Hand-authored while BE ticket is in flight; once the schema ships,
 * swap consumers over to codegen types in @/lib/gql/graphql.
 */

export type CSManagerPeriodType = "MONTH" | "YEAR" | "WEEK" | "CUSTOM";

export interface CSManagerPeriod {
  periodType: CSManagerPeriodType;
  month: number | null;
  year: number | null;
  start: string;
  end: string;
}

export interface CSManagerTarget {
  allocatedTarget: number;
  allocatedSoFar: number;
  onboardedTarget: number;
  onboardedSoFar: number;
  deedsDeliveredTarget: number;
  deedsDeliveredSoFar: number;
  performanceScoreTarget: number;
  performanceScoreSoFar: number;
}

export interface CSManagerPerformanceScore {
  score: number;
  allocatedComponent: number;
  onboardedComponent: number;
  deedsComponent: number;
  target: number;
  actual: number;
  ratingCount: number;
}

/** Obligation signal: paid customers this period who don't yet have a plot. */
export interface CSManagerObligation {
  paidNotAllocatedThisPeriod: number;
}

export interface AgeSplitBacklog {
  total: number;
  thisMonth: number;
  lastMonth: number;
  older: number;
}

export interface OnboardingBacklog {
  total: number;
  callPending: number;
  confirmPending: number;
  disputed: number;
}

export interface CSManagerBacklogs {
  allocation: AgeSplitBacklog;
  onboarding: OnboardingBacklog;
  doa: AgeSplitBacklog;
}

export interface CSManagerPortfolio {
  totalAssigned: number;
  completedPayment: number;
  withinPaymentPeriod: number;
  closeToDefaulting: number;
}

export type CustomerPurchaseStatus =
  | "in_plan"
  | "completed"
  | "close_to_default";

export type OnboardingStatus =
  | "call_pending"
  | "confirmed"
  | "disputed"
  | "not_applicable";

export type AllocationStatus = "awaiting" | "allocated" | "not_applicable";

export type DoaStatus = "not_sent" | "sent" | "not_applicable";

export interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  estate: string;
  product: "flex" | "full-ownership";
  paymentStatus: CustomerPurchaseStatus;
  paymentLabel: string; // e.g. "4 of 12" or "Completed" or "1 mo to default"
  onboarding: OnboardingStatus;
  allocation: AllocationStatus;
  allocationLabel?: string; // e.g. plot code when allocated
  doa: DoaStatus;
  doaLabel?: string; // e.g. "Sent 12 Sep"
  lastActivityAt: string;
}

export interface CSManagerAdmin {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface CSManagerDashboard {
  period: CSManagerPeriod;
  manager: CSManagerAdmin;
  target: CSManagerTarget;
  performanceScore: CSManagerPerformanceScore;
  obligation: CSManagerObligation;
  backlogs: CSManagerBacklogs;
  portfolio: CSManagerPortfolio;
  customers: CustomerRow[];
}
