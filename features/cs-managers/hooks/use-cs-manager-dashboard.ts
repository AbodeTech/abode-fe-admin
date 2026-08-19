"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { CsPlanFilter, CsPlanSort } from "@/lib/gql/graphql";

/**
 * CS Manager dashboard reads — typed via codegen.
 * BE contract: guidelines/CS_Manager_Dashboard.md.
 */

const GET_CS_MANAGER_DASHBOARD_QUERY = graphql(`
  query GetCSManagerDashboard(
    $managerId: ID!
    $month: Int
    $year: Int
    $page: Int
    $limit: Int
    $filter: CSPlanFilter
    $search: String
    $sort: CSPlanSort
  ) {
    getCSManagerDashboard(
      managerId: $managerId
      month: $month
      year: $year
      page: $page
      limit: $limit
      filter: $filter
      search: $search
      sort: $sort
    ) {
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
        allocatedTarget
        allocatedSoFar
        onboardedTarget
        onboardedSoFar
        deedsDeliveredTarget
        deedsDeliveredSoFar
      }
      performanceScore {
        score
        allocatedComponent
        onboardedComponent
        deedsComponent
      }
      obligation {
        paidNotAllocatedThisPeriod
      }
      backlogs {
        allocation { total thisMonth lastMonth older }
        onboarding { total callPending confirmPending disputed }
        doa { total thisMonth lastMonth older }
      }
      portfolio {
        totalAssigned
        completedPayment
        withinPaymentPeriod
        closeToDefaulting
      }
      plans {
        planId
        customer { id firstName lastName email }
        priorPlansCount
        asset
        product
        purchaseDate
        paymentStatus
        paymentLabel
        onboarding
        allocation
        allocationLabel
        doa
        doaLabel
        lastActivityAt
      }
      plansTotal
      filterCounts {
        all
        dueAllocation
        onboardingPending
        dueDoa
        defaultingSoon
        completedPayment
      }
    }
  }
`);

export const csManagerKeys = {
  dashboards: () => ["cs-manager", "dashboard"] as const,
  dashboard: (params: {
    managerId: string;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
    filter?: CsPlanFilter;
    search?: string;
    sort?: CsPlanSort;
  }) =>
    [
      ...csManagerKeys.dashboards(),
      params.managerId,
      params.month ?? null,
      params.year ?? null,
      params.page ?? null,
      params.limit ?? null,
      params.filter ?? null,
      params.search ?? null,
      params.sort ?? null,
    ] as const,
};

export interface UseCSManagerDashboardParams {
  managerId: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  /** Narrows the plans table only — KPIs, backlogs and portfolio stay
   * book-wide, per the BE's schema docs. */
  filter?: CsPlanFilter;
  search?: string;
  sort?: CsPlanSort;
  enabled?: boolean;
}

export const useCSManagerDashboard = ({
  managerId,
  month,
  year,
  page,
  limit,
  filter,
  search,
  sort,
  enabled = true,
}: UseCSManagerDashboardParams) => {
  return useQuery({
    queryKey: csManagerKeys.dashboard({
      managerId,
      month,
      year,
      page,
      limit,
      filter,
      search,
      sort,
    }),
    queryFn: () =>
      execute(GET_CS_MANAGER_DASHBOARD_QUERY, {
        managerId,
        month: month ?? null,
        year: year ?? null,
        page: page ?? null,
        limit: limit ?? null,
        filter: filter ?? null,
        search: search?.trim() ? search.trim() : null,
        sort: sort ?? null,
      }),
    select: (data) => data.getCSManagerDashboard,
    enabled: enabled && !!managerId,
    // Switching manager or period changes the key. Hold the previous
    // dashboard while the next one loads so the picker doesn't drop the
    // whole page to a spinner on every change.
    placeholderData: keepPreviousData,
  });
};
