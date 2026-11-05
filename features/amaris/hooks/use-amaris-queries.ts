'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { AmarisCountsSchema, AmarisQueryListSchema } from '../schemas/amaris.schema';
import { amarisKeys, type AmarisCountFilters, type AmarisListFilters } from './query-keys';

/** The BE defaults to 25 and caps at 100. */
export const DEFAULT_AMARIS_LIMIT = 25;

/** The filter params the list and the counts share. */
const filterParams = (filters: AmarisCountFilters) => ({
  audience: filters.audience,
  channel: filters.channel,
  answered: filters.answered === undefined ? undefined : String(filters.answered),
  q: filters.q || undefined,
  start_date: filters.start_date,
  end_date: filters.end_date,
});

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
        params: { page, limit, ...filterParams(rest) },
      }),
  });
};

/**
 * GET /admin/amaris/queries/counts — the stats strip. Takes the same filters
 * as the list, and every card applies all of them, so with "Associate" on the
 * Customer card reads 0. No filters gives the all-time totals. 30s-fresh is
 * plenty for a log.
 */
export const useAmarisCounts = (filters: AmarisCountFilters = {}) =>
  useQuery({
    queryKey: amarisKeys.counts(filters),
    queryFn: () =>
      apiGet('/admin/amaris/queries/counts', AmarisCountsSchema, { params: filterParams(filters) }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
