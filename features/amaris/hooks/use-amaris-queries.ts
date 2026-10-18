'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { AmarisCountsSchema, AmarisQueryListSchema } from '../schemas/amaris.schema';
import { amarisKeys, type AmarisListFilters } from './query-keys';

/** The BE defaults to 25 and caps at 100. */
export const DEFAULT_AMARIS_LIMIT = 25;

/**
 * GET /admin/amaris/queries — the log, newest first.
 *
 * `answered=false` is the handbook-gap backlog (AA-13): questions Amaris met
 * with the `[NO_ANSWER]` sentinel — the ones worth adding to the source
 * material. `q` searches question, answer, email and phone server-side.
 */
export const useAmarisQueries = (filters?: AmarisListFilters) => {
  const { page = 1, limit = DEFAULT_AMARIS_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: amarisKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGet('/admin/amaris/queries', AmarisQueryListSchema, {
        params: {
          page,
          limit,
          audience: rest.audience,
          channel: rest.channel,
          answered: rest.answered === undefined ? undefined : String(rest.answered),
          q: rest.q || undefined,
        },
      }),
  });
};

/** GET /admin/amaris/queries/counts — the stats strip. 30s-fresh is plenty for a log. */
export const useAmarisCounts = () =>
  useQuery({
    queryKey: amarisKeys.counts(),
    queryFn: () => apiGet('/admin/amaris/queries/counts', AmarisCountsSchema),
    staleTime: 30_000,
  });
