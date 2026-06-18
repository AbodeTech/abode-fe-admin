import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const GET_SYSTEM_ASSOCIATES_DASHBOARD_QUERY = graphql(`
  query GetSystemAssociatesDashboard(
    $filter: ManagerDashboardFilterInput
    $page: Int
    $limit: Int
  ) {
    getSystemAssociatesDashboard(filter: $filter, page: $page, limit: $limit) {
      period {
        periodType
        month
        year
        start
        end
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

interface UseSystemAssociatesDashboardParams {
  filter?: ManagerDashboardFilterInput | null;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const DEFAULT_SYSTEM_ASSOCIATES_LIMIT = 25;

/** Super-admin only — system-wide performance dashboard for all associate-tier
 * users. Same shape as a per-manager dashboard, sourced from every associate
 * regardless of who recruited them. Targets aren't set (system isn't a manager). */
export const useSystemAssociatesDashboard = (
  params: UseSystemAssociatesDashboardParams = {}
) => {
  const {
    filter = null,
    page,
    limit = DEFAULT_SYSTEM_ASSOCIATES_LIMIT,
    enabled = true,
  } = params;

  return useQuery({
    queryKey: managerKeys.systemAssociatesDashboard(filter, page ?? null, limit),
    queryFn: () =>
      execute(GET_SYSTEM_ASSOCIATES_DASHBOARD_QUERY, {
        filter,
        page: page ?? null,
        limit,
      }),
    enabled,
    select: (data) => data.getSystemAssociatesDashboard,
  });
};
