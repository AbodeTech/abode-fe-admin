'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  OverrideListResponseSchema,
  normaliseOverrides,
  type NormalisedOverride,
} from '../schemas/override.schema';
import { commissionKeys, type OverrideListFilters } from './query-keys';

/**
 * GET /admin/commission/overrides — all three override collections.
 *
 * The BE returns `{ asset, user, asset_user }` as separate arrays and applies
 * the same filter object to each. That means filtering by `user_id` returns
 * user and asset+user rows but **no asset rows**, because asset overrides have
 * no `user_id` field. Correct, but the UI has to explain the empty group.
 *
 * `select` flattens the three arrays into one table via `normaliseOverrides`,
 * so the cache holds the raw response and components receive one final shape.
 */
export const useOverrides = (filters?: OverrideListFilters) =>
  useQuery({
    queryKey: commissionKeys.overrideList(filters),
    queryFn: () =>
      apiGet('/admin/commission/overrides', OverrideListResponseSchema, {
        params: {
          offer_type: filters?.offer_type,
          user_id: filters?.user_id,
          asset_id: filters?.asset_id,
          include_inactive: filters?.include_inactive ? true : undefined,
        },
      }),
    select: (data): NormalisedOverride[] => normaliseOverrides(data),
  });
