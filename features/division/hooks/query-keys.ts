export const divisionKeys = {
  all: ['division'] as const,
  config: () => [...divisionKeys.all, 'config'] as const,
  /**
   * Season is part of the key, not a filter on one cache entry: switching year
   * is a different question, and sharing a key would show last season's counts
   * under this season's heading for as long as the refetch takes.
   */
  summary: (seasonYear: number | null) => [...divisionKeys.all, 'summary', seasonYear] as const,
  members: (seasonYear: number | null, tier: string, params: Record<string, unknown>) =>
    [...divisionKeys.all, 'members', seasonYear, tier, params] as const,
};
