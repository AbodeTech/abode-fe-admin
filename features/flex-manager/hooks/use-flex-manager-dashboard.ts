"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

/**
 * FLEX Manager dashboard reads — typed via codegen.
 * BE contract: guidelines/Flex_Manager_Dashboard.md.
 */

const GET_FLEX_MANAGER_DASHBOARD_QUERY = graphql(`
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
`);

const GET_FLEX_MANAGER_QUERY = graphql(`
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
`);

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
    queryFn: () =>
      execute(GET_FLEX_MANAGER_DASHBOARD_QUERY, {
        month: month ?? null,
        year: year ?? null,
      }),
    select: (data) => data.getFlexManagerDashboard,
    enabled,
  });
};

/** Current holder — returned separately from the dashboard so the
 * "Assign / Reassign" panels can render without pulling the KPIs. */
export const useCurrentFlexManager = () => {
  return useQuery({
    queryKey: flexManagerKeys.current(),
    queryFn: () => execute(GET_FLEX_MANAGER_QUERY),
    select: (data) => data.getFlexManager ?? null,
  });
};
