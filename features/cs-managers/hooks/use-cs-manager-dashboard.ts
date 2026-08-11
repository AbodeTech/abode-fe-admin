"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

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
  ) {
    getCSManagerDashboard(
      managerId: $managerId
      month: $month
      year: $year
      page: $page
      limit: $limit
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
    }
  }
`);

export const csManagerKeys = {
  dashboards: () => ["cs-manager", "dashboard"] as const,
  dashboard: (
    managerId: string,
    month?: number,
    year?: number,
    page?: number,
    limit?: number
  ) =>
    [
      ...csManagerKeys.dashboards(),
      managerId,
      month ?? null,
      year ?? null,
      page ?? null,
      limit ?? null,
    ] as const,
};

export interface UseCSManagerDashboardParams {
  managerId: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useCSManagerDashboard = ({
  managerId,
  month,
  year,
  page,
  limit,
  enabled = true,
}: UseCSManagerDashboardParams) => {
  return useQuery({
    queryKey: csManagerKeys.dashboard(managerId, month, year, page, limit),
    queryFn: () =>
      execute(GET_CS_MANAGER_DASHBOARD_QUERY, {
        managerId,
        month: month ?? null,
        year: year ?? null,
        page: page ?? null,
        limit: limit ?? null,
      }),
    select: (data) => data.getCSManagerDashboard,
    enabled: enabled && !!managerId,
  });
};
