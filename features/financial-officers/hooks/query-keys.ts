export const financialOfficerKeys = {
  all: ['financial-officers'] as const,
  list: () => [...financialOfficerKeys.all, 'list'] as const,
  adminPicker: () => [...financialOfficerKeys.all, 'admin-picker'] as const,
  targets: (officerId: string) => [...financialOfficerKeys.all, 'targets', officerId] as const,
  dashboards: () => [...financialOfficerKeys.all, 'dashboard'] as const,
  dashboard: (officerId: string, params: Record<string, unknown>) =>
    [...financialOfficerKeys.dashboards(), officerId, params] as const,
  teamDashboard: (params: Record<string, unknown>) =>
    [...financialOfficerKeys.all, 'team-dashboard', params] as const,
  recoveryPlan: (planId: string) => [...financialOfficerKeys.all, 'recovery-plan', planId] as const,
};
