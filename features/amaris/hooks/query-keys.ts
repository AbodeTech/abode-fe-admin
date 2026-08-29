import type { AmarisAudience, AmarisChannel } from '../schemas/amaris.schema';

/** Mirrors `AdminQueriesQueryDto` — the search param is `q` on the wire. */
export type AmarisListFilters = {
  audience?: AmarisAudience;
  channel?: AmarisChannel;
  answered?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

export const amarisKeys = {
  all: ['amaris'] as const,
  lists: () => [...amarisKeys.all, 'list'] as const,
  list: (filters?: AmarisListFilters) => [...amarisKeys.lists(), filters ?? {}] as const,
  counts: () => [...amarisKeys.all, 'counts'] as const,
};
