import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const ADMIN_GET_MANAGER_DASHBOARD_QUERY = graphql(`
  query AdminGetManagerDashboard(
    $managerId: ID!
    $filter: ManagerDashboardFilterInput
  ) {
    adminGetManagerDashboard(managerId: $managerId, filter: $filter) {
      period {
        periodType
        month
        year
        start
        end
      }
      target {
        recruitedTarget
        recruitedSoFar
        sellingTarget
        sellingSoFar
        performanceScoreTarget
        performanceScoreSoFar
      }
      recruitment {
        newSignupsInPeriod
        upgradesInPeriod
        onboardedInPeriod
        totalAssigned
      }
      salesAndRevenue {
        sellingPros
        sellingProsTarget
        totalRevenue
        initialSalesRevenue
        recurringRevenue
        revenuePerSellingPro
      }
      activity {
        activeCount
        activePct
        recentLoginCount
        recentSaleCount
        recentRecruitCount
        inactiveCount
        inactivePct
        abandonedCount
        abandonedPct
      }
      milestones {
        earlySellers
        lateFirstSellers
      }
      performanceScore {
        target
        actual
      }
      associatePros {
        id
        firstName
        lastName
        email
        phoneNumber
        status
        dateRecruited
        totalSales
        revenueGenerated
        lastLogin
        onboardedAt
      }
    }
  }
`);

/** Super-Admin view of any manager's dashboard. */
export const useAdminManagerDashboard = (
  managerId: string | null | undefined,
  filter?: ManagerDashboardFilterInput | null,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: managerKeys.adminDashboard(managerId ?? "", filter),
    queryFn: () =>
      execute(ADMIN_GET_MANAGER_DASHBOARD_QUERY, {
        managerId: managerId as string,
        filter: filter ?? null,
      }),
    select: (data) => data.adminGetManagerDashboard,
    enabled: !!managerId && options?.enabled !== false,
  });
};

const MANAGER_DASHBOARD_QUERY = graphql(`
  query ManagerDashboard($filter: ManagerDashboardFilterInput) {
    managerDashboard(filter: $filter) {
      period {
        periodType
        month
        year
        start
        end
      }
      target {
        recruitedTarget
        recruitedSoFar
        sellingTarget
        sellingSoFar
        performanceScoreTarget
        performanceScoreSoFar
      }
      recruitment {
        newSignupsInPeriod
        upgradesInPeriod
        onboardedInPeriod
        totalAssigned
      }
      salesAndRevenue {
        sellingPros
        sellingProsTarget
        totalRevenue
        initialSalesRevenue
        recurringRevenue
        revenuePerSellingPro
      }
      activity {
        activeCount
        activePct
        recentLoginCount
        recentSaleCount
        recentRecruitCount
        inactiveCount
        inactivePct
        abandonedCount
        abandonedPct
      }
      milestones {
        earlySellers
        lateFirstSellers
      }
      performanceScore {
        target
        actual
      }
      associatePros {
        id
        firstName
        lastName
        email
        phoneNumber
        status
        dateRecruited
        totalSales
        revenueGenerated
        lastLogin
        onboardedAt
      }
    }
  }
`);

/** Manager-self view (auth derives the managerId from the logged-in admin). */
export const useManagerDashboard = (
  filter?: ManagerDashboardFilterInput | null,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: managerKeys.selfDashboard(filter),
    queryFn: () =>
      execute(MANAGER_DASHBOARD_QUERY, { filter: filter ?? null }),
    select: (data) => data.managerDashboard,
    enabled: options?.enabled !== false,
  });
};
