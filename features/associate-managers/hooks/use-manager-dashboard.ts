import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
        revenueTarget
        revenueSoFar
        performanceScoreTarget
        performanceScoreSoFar
      }
      recruitment {
        newSignupsInPeriod
        upgradesInPeriod
        onboardedInPeriod
        onboardedFreshInPeriod
        onboardedCarryoverInPeriod
        totalAssigned
        onboardingQueueCount
        newSignupsBySource { managed unassigned users associate }
        upgradesBySource { managed unassigned users associate }
        topNewSignupsContributors { proId firstName lastName email count }
        topUpgradesContributors { proId firstName lastName email count }
        othersNewSignupsCount
        othersUpgradesCount
        activeRecruitingProsCount
        activePromotingProsCount
      }
      salesAndRevenue {
        sellingPros
        sellingProsTarget
        totalRevenue
        initialSalesRevenue
        recurringRevenue
        revenuePerSellingPro
        salesCountBySource { managed unassigned users associate }
        revenueBySource { managed unassigned users associate }
        topSellingContributors { proId firstName lastName email amount }
        othersSellingRevenue
        activeRevenueGeneratingProsCount
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
        score
        sellingComponent
        revenueComponent
        recruitmentComponent
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

/** Super-Admin view of any manager's dashboard. */
export const useAdminManagerDashboard = (
  managerId: string | null | undefined,
  filter?: ManagerDashboardFilterInput | null,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
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
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
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
        revenueTarget
        revenueSoFar
        performanceScoreTarget
        performanceScoreSoFar
      }
      recruitment {
        newSignupsInPeriod
        upgradesInPeriod
        onboardedInPeriod
        onboardedFreshInPeriod
        onboardedCarryoverInPeriod
        totalAssigned
        onboardingQueueCount
        newSignupsBySource { managed unassigned users associate }
        upgradesBySource { managed unassigned users associate }
        topNewSignupsContributors { proId firstName lastName email count }
        topUpgradesContributors { proId firstName lastName email count }
        othersNewSignupsCount
        othersUpgradesCount
        activeRecruitingProsCount
        activePromotingProsCount
      }
      salesAndRevenue {
        sellingPros
        sellingProsTarget
        totalRevenue
        initialSalesRevenue
        recurringRevenue
        revenuePerSellingPro
        salesCountBySource { managed unassigned users associate }
        revenueBySource { managed unassigned users associate }
        topSellingContributors { proId firstName lastName email amount }
        othersSellingRevenue
        activeRevenueGeneratingProsCount
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
        score
        sellingComponent
        revenueComponent
        recruitmentComponent
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

/** Manager-self view (auth derives the managerId from the logged-in admin). */
export const useManagerDashboard = (
  filter?: ManagerDashboardFilterInput | null,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
) => {
  return useQuery({
    queryKey: managerKeys.selfDashboard(filter),
    queryFn: () =>
      execute(MANAGER_DASHBOARD_QUERY, { filter: filter ?? null }),
    select: (data) => data.managerDashboard,
    enabled: options?.enabled !== false,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
};
