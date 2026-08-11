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

/**
 * One row per PAYMENT PLAN (not per customer).
 *
 * A customer with two active plans surfaces as two rows — each plan
 * carries its own onboarding call, allocation, and DoA state, which is
 * how the CSM's workload is actually measured. Total Assigned still
 * counts unique customers (see CSManagerPortfolio).
 */
export interface PlanRow {
  /** Payment plan id — this is the row identity. */
  planId: string;
  /** Underlying customer — repeated across a customer's rows. */
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  /** Number of OTHER plans this customer has (all-time). 0 = first-time
   * buyer; >0 = repeat, worth flagging in the onboarding call. */
  priorPlansCount: number;
  asset: string;                // e.g. "Amara Estates"
  product: "flex" | "full-ownership";
  purchaseDate: string;         // when the plan opened
  paymentStatus: CustomerPurchaseStatus;
  paymentLabel: string;         // e.g. "4 of 12" or "Completed" or "1 mo to default"
  onboarding: OnboardingStatus;
  allocation: AllocationStatus;
  allocationLabel?: string;     // plot code when allocated
  doa: DoaStatus;
  doaLabel?: string;            // e.g. "Sent 12 Sep"
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
  /** Plans (payment plans) belonging to this CSM's assigned customers. */
  plans: PlanRow[];
}
