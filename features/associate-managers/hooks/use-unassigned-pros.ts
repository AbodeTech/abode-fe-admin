'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { ProSummarySchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

export const DEFAULT_UNASSIGNED_LIMIT = 20;

interface UseUnassignedProsParams {
  page?: number;
  limit?: number;
  q?: string | null;
}

/** GET /admin/managers/unassigned-pros — associate pros on no manager's roster. */
export const useUnassignedPros = (params?: UseUnassignedProsParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_UNASSIGNED_LIMIT;
  const q = params?.q ?? null;

  return useQuery({
    queryKey: managerKeys.unassignedList({ page, limit, q }),
    queryFn: () =>
      apiGetPaged('/admin/managers/unassigned-pros', ProSummarySchema, {
        params: { page, limit, ...(q ? { q } : {}) },
      }),
  });
};

/**
 * Just the size of the unassigned pool, for the "N pros need a manager" badge.
 *
 * There is no count-only endpoint; the paged route's `meta.total` is the count,
 * so this asks for a single row and reads the meta.
 */
export const useUnassignedProsCount = (q?: string | null) =>
  useQuery({
    queryKey: managerKeys.unassignedList({ page: 1, limit: 1, q: q ?? null }),
    queryFn: () =>
      apiGetPaged('/admin/managers/unassigned-pros', ProSummarySchema, {
        params: { page: 1, limit: 1, ...(q ? { q } : {}) },
      }),
    select: (result) => result.meta.total ?? 0,
  });
