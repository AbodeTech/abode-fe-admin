import { useQuery } from "@tanstack/react-query";
import type { FlexManagerDashboard } from "../types";

/**
 * FLEX Manager dashboard — TEMPORARY MOCK.
 *
 * Returns typed fixture data shaped to the BE ticket
 * (guidelines/Flex_Manager_Dashboard.md). Once BE ships:
 *   - Replace the queryFn body with `execute(graphql(\`…\`), variables)`
 *   - Switch consumers over to codegen types in @/lib/gql/graphql
 *   - No component changes needed.
 */

const MOCK_ASSIGNED: FlexManagerDashboard = {
  period: {
    periodType: "MONTH",
    month: 9,
    year: 2026,
    start: "2026-09-01",
    end: "2026-09-30",
  },
  manager: {
    _id: "chidi",
    firstName: "Chidi",
    lastName: "Okonkwo",
    email: "chidi.okonkwo@abode.ng",
    assignedFrom: "2026-06-01",
  },
  target: {
    newCustomersTarget: 40,
    newCustomersSoFar: 27,

    newSalesValueTarget: 50_000_000,
    newSalesValueSoFar: 38_500_000,

    recurringTarget: 20_000_000,
    recurringSoFar: 17_450_000,
    recurringExpected: 22_100_000,
  },
  performanceScore: {
    score: 74.4,
    newCustomersComponent: 33.75, // (27/40) * 50
    newSalesComponent: 23.1,      // (38.5M/50M) * 30
    recurringComponent: 17.45,    // (17.45M/20M) * 20
  },
};

/** Swap to `null` in-place to demo the unassigned empty state. */
const MOCK: FlexManagerDashboard = MOCK_ASSIGNED;

export const flexManagerKeys = {
  dashboards: () => ["flex-manager", "dashboard"] as const,
  dashboard: (month?: number, year?: number) =>
    [...flexManagerKeys.dashboards(), month ?? null, year ?? null] as const,
  current: () => ["flex-manager", "current"] as const,
};

export interface UseFlexManagerDashboardParams {
  month?: number;
  year?: number;
  enabled?: boolean;
}

export const useFlexManagerDashboard = ({
  month,
  year,
  enabled = true,
}: UseFlexManagerDashboardParams = {}) => {
  return useQuery({
    queryKey: flexManagerKeys.dashboard(month, year),
    queryFn: async (): Promise<FlexManagerDashboard> => {
      // Replace with `execute(GET_FLEX_MANAGER_DASHBOARD_QUERY, { month, year })`
      // once BE ships.
      await new Promise((r) => setTimeout(r, 120));
      return MOCK;
    },
    enabled,
  });
};
