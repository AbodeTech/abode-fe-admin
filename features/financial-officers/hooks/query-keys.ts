export const financialOfficerKeys = {
  all: ['financial-officers'] as const,
  list: () => [...financialOfficerKeys.all, 'list'] as const,
  me: () => [...financialOfficerKeys.all, 'me'] as const,
  adminPicker: () => [...financialOfficerKeys.all, 'admin-picker'] as const,
  targets: (officerId: string) => [...financialOfficerKeys.all, 'targets', officerId] as const,
  dashboards: () => [...financialOfficerKeys.all, 'dashboard'] as const,
  dashboard: (officerId: string, params: Record<string, unknown>) =>
    [...financialOfficerKeys.dashboards(), officerId, params] as const,
  teamDashboards: () => [...financialOfficerKeys.all, 'team-dashboard'] as const,
  teamDashboard: (params: Record<string, unknown>) =>
    [...financialOfficerKeys.teamDashboards(), params] as const,
  recoveryPlan: (planId: string, assignmentId: string | null) =>
    [...financialOfficerKeys.all, 'recovery-plan', planId, assignmentId] as const,
};
