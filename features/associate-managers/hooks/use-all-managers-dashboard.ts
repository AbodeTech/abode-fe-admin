import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const GET_ALL_MANAGERS_DASHBOARD_QUERY = graphql(`
  query GetAllManagersDashboard(
    $filter: ManagerDashboardFilterInput
    $page: Int
    $limit: Int
  ) {
    getAllManagersDashboard(filter: $filter, page: $page, limit: $limit) {
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
        onboardingQueueCount
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
        ratingCount
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
      associateProsGroupTotal
    }
  }
`);

interface UseAllManagersDashboardParams {
  filter?: ManagerDashboardFilterInput | null;
  page?: number;
  limit?: number;
  enabled?: boolean;
  keepPreviousData?: boolean;
}

export const DEFAULT_ALL_MANAGERS_LIMIT = 25;

/** Super-admin only — combined view across every manager's roster.
 * Targets are summed across all managers for the period. */
export const useAllManagersDashboard = (
  params: UseAllManagersDashboardParams = {}
) => {
  const {
    filter = null,
    page,
    limit = DEFAULT_ALL_MANAGERS_LIMIT,
    enabled = true,
    keepPreviousData: keepPrevious = false,
  } = params;

  return useQuery({
    queryKey: managerKeys.allManagersDashboard(filter, page ?? null, limit),
    queryFn: () =>
      execute(GET_ALL_MANAGERS_DASHBOARD_QUERY, {
        filter,
        page: page ?? null,
        limit,
      }),
    enabled,
    select: (data) => data.getAllManagersDashboard,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });
};
