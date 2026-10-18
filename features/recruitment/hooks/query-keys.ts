export const recruitmentKeys = {
  all: ['recruitment'] as const,
  programmes: () => [...recruitmentKeys.all, 'programmes'] as const,
  programmeList: (filters: Record<string, unknown>) =>
    [...recruitmentKeys.programmes(), 'list', filters] as const,
  programme: (id: string) => [...recruitmentKeys.programmes(), id] as const,
  cohorts: (programmeId: string) =>
    [...recruitmentKeys.all, 'cohorts', programmeId] as const,
  cohort: (id: string) => [...recruitmentKeys.all, 'cohort', id] as const,
  dashboard: (cohortId: string, from: string, to: string) =>
    [...recruitmentKeys.all, 'dashboard', cohortId, from, to] as const,
  registrants: (cohortId: string, filters: Record<string, unknown>) =>
    [...recruitmentKeys.all, 'registrants', cohortId, filters] as const,
  referrals: (cohortId: string, filters: Record<string, unknown>) =>
    [...recruitmentKeys.all, 'referrals', cohortId, filters] as const,
  tests: (cohortId: string, filters: Record<string, unknown>) =>
    [...recruitmentKeys.all, 'tests', cohortId, filters] as const,
  test: (id: string) => [...recruitmentKeys.all, 'test', id] as const,
  testAttempts: (testId: string, filters: Record<string, unknown>) =>
    [...recruitmentKeys.all, 'test-attempts', testId, filters] as const,
};

export const DEFAULT_PROGRAMMES_LIMIT = 20;
export const DEFAULT_REGISTRANTS_LIMIT = 20;
