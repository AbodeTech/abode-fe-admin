/** Every key carries the year — changing it refetches every section. */
export const trackerKeys = {
  all: ['associate-pro-tracker'] as const,
  dashboard: (year: number) => [...trackerKeys.all, 'dashboard', year] as const,
  years: () => [...trackerKeys.all, 'years'] as const,
  goal: (year: number) => [...trackerKeys.all, 'goal', year] as const,
};
