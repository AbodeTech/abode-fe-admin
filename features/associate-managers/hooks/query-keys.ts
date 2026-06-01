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
};
