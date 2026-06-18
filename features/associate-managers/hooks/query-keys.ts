import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";

interface ManagerListFilters {
  page?: number;
  limit?: number;
  searchQuery?: string | null;
}

interface UnassignedListFilters {
  page?: number;
  limit?: number;
  searchQuery?: string | null;
}

export const managerKeys = {
  all: ["associate-managers"] as const,

  // List of managers (Super Admin dropdown / table)
  lists: () => [...managerKeys.all, "list"] as const,
  list: (filters?: ManagerListFilters) => [...managerKeys.lists(), filters] as const,

  // A single manager doc (manager + populated pros)
  details: () => [...managerKeys.all, "detail"] as const,
  detail: (managerId: string) => [...managerKeys.details(), managerId] as const,

  // Dashboard payloads (snapshot + sections + roster all-in-one)
  dashboards: () => [...managerKeys.all, "dashboard"] as const,
  adminDashboard: (managerId: string, filter?: ManagerDashboardFilterInput | null) =>
    [...managerKeys.dashboards(), "admin", managerId, filter] as const,
  selfDashboard: (filter?: ManagerDashboardFilterInput | null) =>
    [...managerKeys.dashboards(), "self", filter] as const,

  // Targets per manager
  targetsAll: (managerId: string) => [...managerKeys.detail(managerId), "targets"] as const,
  target: (managerId: string, month?: number | null, year?: number | null) =>
    [...managerKeys.targetsAll(managerId), month ?? null, year ?? null] as const,

  // Unassigned Pro pool
  unassigned: () => [...managerKeys.all, "unassigned"] as const,
  unassignedList: (filters?: UnassignedListFilters) =>
    [...managerKeys.unassigned(), "list", filters] as const,
  unassignedCount: (searchQuery?: string | null) =>
    [...managerKeys.unassigned(), "count", searchQuery ?? null] as const,

  // Onboarding attempts per Pro
  onboarding: () => [...managerKeys.all, "onboarding"] as const,
  onboardingAttempts: (proId: string) =>
    [...managerKeys.onboarding(), "pro", proId] as const,

  // Team sales (per manager). `self` covers the logged-in-manager endpoint;
  // `admin` is the super-admin view of a specific manager's team sales.
  teamSales: () => [...managerKeys.all, "team-sales"] as const,
  teamSalesSelf: (filters?: unknown) =>
    [...managerKeys.teamSales(), "self", filters] as const,
  teamSalesAdmin: (managerId: string, filters?: unknown) =>
    [...managerKeys.teamSales(), "admin", managerId, filters] as const,

  // System-wide associates dashboard (super-admin only) — treats all
  // associate-tier users as a single virtual roster.
  systemAssociatesDashboard: (
    filter?: ManagerDashboardFilterInput | null,
    page?: number | null,
    limit?: number | null,
  ) =>
    [
      ...managerKeys.all,
      "system-associates",
      filter,
      page ?? null,
      limit ?? null,
    ] as const,

  // Combined dashboard across every manager's roster (super-admin only).
  // Targets are summed across all managers for the period.
  allManagersDashboard: (
    filter?: ManagerDashboardFilterInput | null,
    page?: number | null,
    limit?: number | null,
  ) =>
    [
      ...managerKeys.dashboards(),
      "all-managers",
      filter,
      page ?? null,
      limit ?? null,
    ] as const,
};
