'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import {
  TopAssociateSchema,
  type TopAssociateListParams,
} from '../schemas/top-associate.schema';
import { associateKeys } from './query-keys';

export const DEFAULT_LEADERBOARD_LIMIT = 25;

/**
 * GET /admin/associates/top — the full associate leaderboard.
 *
 * KNOWN GAP: the row TOTAL does not survive the response envelope. The BE
 * returns `{ count, data }`, and the global TransformInterceptor unwraps any
 * payload with a `data` key while carrying through only `meta` — so `count` is
 * dropped and `meta.total` is never set. Until the BE returns
 * `{ data, meta: { total, … } }` (the shape `AssociateManagerService.paginate`
 * already uses for exactly this reason), `meta.total` is undefined here and the
 * caller has to page by whether a full page came back.
 */
export const useTopAssociates = (params?: TopAssociateListParams) => {
  const {
    page = 1,
    limit = DEFAULT_LEADERBOARD_LIMIT,
    include_suspended,
    ...filters
  } = params ?? {};

  return useQuery({
    queryKey: associateKeys.list({ page, limit, include_suspended, ...filters }),
    queryFn: () =>
      apiGetPaged('/admin/associates/top', TopAssociateSchema, {
        params: {
          page,
          limit,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          asset_type: filters.asset_type,
          referral_status: filters.referral_status,
          sort_by: filters.sort_by,
          sort_dir: filters.sort_dir,
          // Omitted rather than sent as false: the BE defaults it, and an
          // explicit `false` is noise on an audit-opt-in flag.
          ...(include_suspended ? { include_suspended: true } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};
