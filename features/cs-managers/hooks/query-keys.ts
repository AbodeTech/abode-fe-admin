export const csManagerKeys = {
  all: ['cs-managers'] as const,
  list: () => [...csManagerKeys.all, 'list'] as const,
  unassigned: (page: number, limit: number) =>
    [...csManagerKeys.all, 'unassigned', page, limit] as const,
  targets: (managerId: string) => [...csManagerKeys.all, 'targets', managerId] as const,
  target: (managerId: string, year: number, month: number) =>
    [...csManagerKeys.all, 'target', managerId, year, month] as const,
  adminPicker: () => [...csManagerKeys.all, 'admin-picker'] as const,
  dashboards: () => [...csManagerKeys.all, 'dashboard'] as const,
  dashboard: (managerId: string, params: Record<string, unknown>) =>
    [...csManagerKeys.dashboards(), managerId, params] as const,
  onboardingAttempts: (planId: string) => [...csManagerKeys.all, 'onboarding-attempts', planId] as const,
};
