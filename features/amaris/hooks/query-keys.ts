import type { AmarisAudience, AmarisChannel } from '../schemas/amaris.schema';

/** Mirrors `AdminQueriesQueryDto` — the search param is `q` on the wire. */
export type AmarisListFilters = {
  audience?: AmarisAudience;
  channel?: AmarisChannel;
  answered?: boolean;
  q?: string;
  /** Lagos calendar dates, `YYYY-MM-DD`, both inclusive. */
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
};

/** The counts take the list's filters, without paging. */
export type AmarisCountFilters = Omit<AmarisListFilters, 'page' | 'limit'>;

export const amarisKeys = {
  all: ['amaris'] as const,
  lists: () => [...amarisKeys.all, 'list'] as const,
  list: (filters?: AmarisListFilters) => [...amarisKeys.lists(), filters ?? {}] as const,
  counts: (filters?: AmarisCountFilters) => [...amarisKeys.all, 'counts', filters ?? {}] as const,
};
