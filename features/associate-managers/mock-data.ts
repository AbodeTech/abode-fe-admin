// Legacy-shaped types kept for components that still pass values through to
// dialogs the BE hasn't reshaped (AssociateProsTable adapter, BulkReassignDialog,
// PeriodSelector). Drop entries once those consumers move to GraphQL types.

export type Period = "week" | "month" | "year";

export type ProStatus = "active" | "inactive" | "abandoned";

export interface AssociatePro {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: ProStatus;
  recruitedAt: string;
  onboardedAt: string | null;
  totalSales: number;
  totalRevenue: number;
  lastLogin: string;
}
