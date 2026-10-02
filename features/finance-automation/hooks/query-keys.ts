import type { PostingFilters, RunFilters } from '../schemas/finance.schema';

export const financeKeys = {
  all: ['finance-automation'] as const,
  runs: (filters: RunFilters) => [...financeKeys.all, 'runs', filters] as const,
  run: (id: string) => [...financeKeys.all, 'run', id] as const,
  postings: (filters: PostingFilters) => [...financeKeys.all, 'postings', filters] as const,
};
