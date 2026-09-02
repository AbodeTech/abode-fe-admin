/**
 * Cache keys for the Associate Manager Tracker.
 *
 * Every `managerId` here is the ADMIN id (`ManagerListItem.manager_id`), the
 * same value the `:manager_id` routes take — see the schema module's note.
 */

interface ListFilters {
  page?: number;
  limit?: number;
  q?: string | null;
}

/** Flat REST query params: period_type, month, year, pro_group, page… */
type DashboardParams = Record<string, unknown> | null | undefined;

export const managerKeys = {
  all: ['associate-managers'] as const,

  // List of managers (Super Admin dropdown / table)
  lists: () => [...managerKeys.all, 'list'] as const,
  list: (filters?: ListFilters) => [...managerKeys.lists(), filters] as const,

  // A single manager (manager + roster)
  details: () => [...managerKeys.all, 'detail'] as const,
  detail: (managerId: string) => [...managerKeys.details(), managerId] as const,

  /** GET /admin/managers/me — "am I a manager, and which one?" */
  me: () => [...managerKeys.all, 'me'] as const,

  /** GET /admin/admins — the promote-a-manager picker. */
  adminPicker: () => [...managerKeys.all, 'admin-picker'] as const,

  // Dashboard payloads (snapshot + sections + roster all-in-one)
  dashboards: () => [...managerKeys.all, 'dashboard'] as const,
  adminDashboard: (managerId: string, params?: DashboardParams) =>
    [...managerKeys.dashboards(), 'admin', managerId, params] as const,
  selfDashboard: (params?: DashboardParams) =>
    [...managerKeys.dashboards(), 'self', params] as const,
  systemDashboard: (params?: DashboardParams) =>
    [...managerKeys.dashboards(), 'system', params] as const,
  allManagersDashboard: (params?: DashboardParams) =>
    [...managerKeys.dashboards(), 'all-managers', params] as const,
  prosGroup: (viewMode: string, managerId: string | null, params?: DashboardParams) =>
    [...managerKeys.dashboards(), 'pros-group', viewMode, managerId, params] as const,

  // Targets per manager
  targetsAll: (managerId: string) => [...managerKeys.detail(managerId), 'targets'] as const,
  target: (managerId: string, year?: number | null, month?: number | null) =>
    [...managerKeys.targetsAll(managerId), year ?? null, month ?? null] as const,

  // Unassigned Pro pool
  unassigned: () => [...managerKeys.all, 'unassigned'] as const,
  unassignedList: (filters?: ListFilters) =>
    [...managerKeys.unassigned(), 'list', filters] as const,

  // Onboarding attempts per Pro
  onboarding: () => [...managerKeys.all, 'onboarding'] as const,
  onboardingAttempts: (proId: string) => [...managerKeys.onboarding(), 'pro', proId] as const,

  // Team sales (per manager). `self` is the guard-scoped own-team endpoint.
  teamSales: () => [...managerKeys.all, 'team-sales'] as const,
  teamSalesSelf: (filters?: unknown) => [...managerKeys.teamSales(), 'self', filters] as const,
  teamSalesAdmin: (managerId: string, filters?: unknown) =>
    [...managerKeys.teamSales(), 'admin', managerId, filters] as const,

  // Rating trend series per manager.
  ratingSeries: (managerId: string, monthsBack: number) =>
    [...managerKeys.all, 'rating-series', managerId, monthsBack] as const,
};
