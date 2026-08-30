'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { AllocationAssetOptionSchema } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

const DROPDOWN_LIMIT = 200;

/**
 * Asset options for the allocation filter dropdown, sourced from the real
 * `GET /admin/assets` (v2 Asset model — `name`, not v1's `asset_name`).
 *
 * Replaces the old GraphQL `getAllAdminAssets` query, which selected v1
 * fields (`asset_name`, `asset_type`, `asset_option { size }`) that don't
 * exist on the v2 schema — it was almost certainly returning schema-mismatch
 * errors or empty data against a real backend already.
 */
export const useAllocationAssets = () => {
  return useQuery({
    queryKey: allocationKeys.assets,
    queryFn: () =>
      apiGetPaged('/admin/assets', AllocationAssetOptionSchema, {
        params: { limit: DROPDOWN_LIMIT },
      }),
    select: (data) => data.items,
  });
};

export type AllocationAssetOptions = NonNullable<ReturnType<typeof useAllocationAssets>['data']>;
