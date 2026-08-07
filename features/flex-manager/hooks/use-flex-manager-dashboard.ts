"use client";

import { useQuery } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";
import type {
  FlexManagerDashboard,
  FlexManagerHolder,
} from "../types";

/**
 * FLEX Manager dashboard hooks — wired to live BE
 * (guidelines/Flex_Manager_Dashboard.md).
 *
 * Uses executeRaw + hand-typed responses until codegen can pick up the
 * schema (BE server was down at wiring time). Once codegen runs, swap
 * these string queries for `graphql()` templates and drop the local
 * types in favour of @/lib/gql/graphql.
 */

const GET_FLEX_MANAGER_DASHBOARD = `
  query GetFlexManagerDashboard($month: Int, $year: Int) {
    getFlexManagerDashboard(month: $month, year: $year) {
      period {
        periodType
        month
        year
        start
        end
      }
      manager {
        _id
        userName
        email
        role
      }
      target {
        newCustomersTarget
        newCustomersSoFar
        newSalesValueTarget
        newSalesValueSoFar
        recurringTarget
        recurringSoFar
        recurringExpected
      }
      performanceScore {
        score
        newCustomersComponent
        newSalesComponent
        recurringComponent
      }
    }
  }
`;

const GET_FLEX_MANAGER = `
  query GetFlexManager {
    getFlexManager {
      manager {
        _id
        userName
        email
        role
      }
      assignedFrom
    }
  }
`;

export const flexManagerKeys = {
  dashboards: () => ["flex-manager", "dashboard"] as const,
  dashboard: (month?: number, year?: number) =>
    [...flexManagerKeys.dashboards(), month ?? null, year ?? null] as const,
  current: () => ["flex-manager", "current"] as const,
  targets: (managerId: string) =>
    ["flex-manager", "targets", managerId] as const,
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
    queryFn: async () => {
      const data = await executeRaw<{
        getFlexManagerDashboard: FlexManagerDashboard;
      }>(GET_FLEX_MANAGER_DASHBOARD, {
        month: month ?? null,
        year: year ?? null,
      });
      return data.getFlexManagerDashboard;
    },
    enabled,
  });
};

/** Current holder — returned separately from the dashboard so the
 * "Assign / Reassign" panels can render without pulling the KPIs. */
export const useCurrentFlexManager = () => {
  return useQuery({
    queryKey: flexManagerKeys.current(),
    queryFn: async () => {
      const data = await executeRaw<{
        getFlexManager: FlexManagerHolder | null;
      }>(GET_FLEX_MANAGER);
      return data.getFlexManager;
    },
  });
};
