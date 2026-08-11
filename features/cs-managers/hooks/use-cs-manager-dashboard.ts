import { useQuery } from "@tanstack/react-query";
import type { CSManagerDashboard } from "../types";

/**
 * CS Manager dashboard — TEMPORARY MOCK.
 *
 * Returns typed fixture data shaped to the ticket
 * (guidelines/CS_Manager_Dashboard.md, pending). When the BE ships:
 *   - Replace the queryFn body with `execute(graphql(\`…\`), variables)`
 *   - Swap the import in types.ts to `@/lib/gql/graphql`
 *   - No consumer components change.
 */

const MOCK_MANAGERS: Record<string, CSManagerDashboard> = {
  adenike: {
    period: {
      periodType: "MONTH",
      month: 9,
      year: 2026,
      start: "2026-09-01",
      end: "2026-09-30",
    },
    manager: {
      _id: "adenike",
      firstName: "Adenike",
      lastName: "Balogun",
      email: "adenike.balogun@abode.ng",
    },
    target: {
      allocatedTarget: 30,
      allocatedSoFar: 24,
      onboardedTarget: 25,
      onboardedSoFar: 18,
      deedsDeliveredTarget: 15,
      deedsDeliveredSoFar: 8,
      performanceScoreTarget: 4,
      performanceScoreSoFar: 4.3,
    },
    performanceScore: {
      score: 70.6,
      allocatedComponent: 32,
      onboardedComponent: 21.6,
      deedsComponent: 16,
      target: 4,
      actual: 4.3,
      ratingCount: 12,
    },
    obligation: {
      paidNotAllocatedThisPeriod: 3,
    },
    backlogs: {
      allocation: { total: 12, thisMonth: 4, lastMonth: 5, older: 3 },
      onboarding: { total: 19, callPending: 9, confirmPending: 7, disputed: 3 },
      doa: { total: 11, thisMonth: 6, lastMonth: 3, older: 2 },
    },
    portfolio: {
      totalAssigned: 47,
      completedPayment: 31,
      withinPaymentPeriod: 14,
      closeToDefaulting: 5,
    },
    plans: [
      {
        planId: "p1",
        customer: { id: "c1", firstName: "Ademola", lastName: "Ojo", email: "ademola.ojo@gmail.com" },
        priorPlansCount: 0,
        asset: "Amara Estates", product: "flex",
        purchaseDate: "2026-08-20",
        paymentStatus: "completed", paymentLabel: "Completed",
        onboarding: "confirmed",
        allocation: "awaiting",
        doa: "not_applicable",
        lastActivityAt: "2026-09-22T10:00:00Z",
      },
      {
        planId: "p2",
        customer: { id: "c2", firstName: "Ebuka", lastName: "Nwosu", email: "ebuka.nwosu@yahoo.com" },
        priorPlansCount: 0,
        asset: "Coastal View", product: "full-ownership",
        purchaseDate: "2026-09-15",
        paymentStatus: "in_plan", paymentLabel: "In plan · 4 of 12",
        onboarding: "call_pending",
        allocation: "not_applicable",
        doa: "not_applicable",
        lastActivityAt: "2026-09-21T15:00:00Z",
      },
      {
        planId: "p3",
        customer: { id: "c3", firstName: "Funmi", lastName: "Idowu", email: "funmi.idowu@abode.ng" },
        priorPlansCount: 0,
        asset: "Coastal View", product: "flex",
        purchaseDate: "2026-07-05",
        paymentStatus: "completed", paymentLabel: "Completed",
        onboarding: "confirmed",
        allocation: "allocated", allocationLabel: "Plot 44B",
        doa: "not_sent",
        lastActivityAt: "2026-09-19T12:00:00Z",
      },
      {
        planId: "p4",
        customer: { id: "c4", firstName: "Chiamaka", lastName: "Johnson", email: "chi.johnson@gmail.com" },
        priorPlansCount: 0,
        asset: "Amara Estates", product: "full-ownership",
        purchaseDate: "2025-11-02",
        paymentStatus: "close_to_default", paymentLabel: "1 mo to default",
        onboarding: "confirmed",
        allocation: "not_applicable",
        doa: "not_applicable",
        lastActivityAt: "2026-09-16T09:00:00Z",
      },
      {
        planId: "p5",
        customer: { id: "c5", firstName: "David", lastName: "Okafor", email: "david.okafor@outlook.com" },
        priorPlansCount: 0,
        asset: "Serene Ridge", product: "flex",
        purchaseDate: "2026-09-01",
        paymentStatus: "completed", paymentLabel: "Completed",
        onboarding: "disputed",
        allocation: "not_applicable",
        doa: "not_applicable",
        lastActivityAt: "2026-09-21T18:00:00Z",
      },
      {
        planId: "p6",
        customer: { id: "c6", firstName: "Tomiwa", lastName: "Adebayo", email: "tomiwa.a@gmail.com" },
        priorPlansCount: 0,
        asset: "Coastal View", product: "full-ownership",
        purchaseDate: "2025-08-10",
        paymentStatus: "completed", paymentLabel: "Completed",
        onboarding: "confirmed",
        allocation: "allocated", allocationLabel: "Plot 12A",
        doa: "sent", doaLabel: "Sent 12 Sep",
        lastActivityAt: "2026-09-08T14:00:00Z",
      },
      {
        planId: "p7",
        customer: { id: "c1", firstName: "Ademola", lastName: "Ojo", email: "ademola.ojo@gmail.com" },
        priorPlansCount: 1,
        asset: "Serene Ridge", product: "flex",
        purchaseDate: "2026-09-14",
        paymentStatus: "in_plan", paymentLabel: "In plan · 1 of 6",
        onboarding: "call_pending",
        allocation: "not_applicable",
        doa: "not_applicable",
        lastActivityAt: "2026-09-14T08:00:00Z",
      },
    ],
  },
};

export interface UseCSManagerDashboardParams {
  managerId: string;
  month?: number;
  year?: number;
  enabled?: boolean;
}

export const csManagerKeys = {
  dashboards: () => ["cs-manager", "dashboard"] as const,
  dashboard: (managerId: string, month?: number, year?: number) =>
    [...csManagerKeys.dashboards(), managerId, month ?? null, year ?? null] as const,
};

export const useCSManagerDashboard = ({
  managerId,
  month,
  year,
  enabled = true,
}: UseCSManagerDashboardParams) => {
  return useQuery({
    queryKey: csManagerKeys.dashboard(managerId, month, year),
    queryFn: async (): Promise<CSManagerDashboard> => {
      // Mock: return the seeded manager, or fall through to Adenike.
      // Replace with `execute(GET_CS_MANAGER_DASHBOARD_QUERY, { managerId, month, year })`
      // once BE ships.
      await new Promise((r) => setTimeout(r, 120)); // fake round-trip
      return MOCK_MANAGERS[managerId] ?? MOCK_MANAGERS.adenike;
    },
    enabled,
  });
};
