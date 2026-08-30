'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { AllocationPlotSchema, type AllocationPlot } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

export type Plot = AllocationPlot;

export interface UseAvailablePlotsParams {
  assetId: string;
  size?: number;
  enabled?: boolean;
}

/**
 * GET /admin/allocation/assets/:asset_id/available-plots — confirmed against
 * abode-be-v2's allocation module on `origin/staging` (2026-08-28, not yet
 * deployed to this app's target environment). Returns a flat, unpaginated
 * array — not run through `apiGetPaged`.
 *
 * Replaces the old GraphQL `getAvailablePlotsForAsset` in the deleted
 * `use-plots.ts`. The by-name asset lookup that file also carried
 * (`useAssetIdByName`) is gone too — every eligible-clients row now carries
 * `asset_id` directly.
 */
export const useAvailablePlotsForAsset = ({ assetId, size, enabled = true }: UseAvailablePlotsParams) => {
  return useQuery({
    queryKey: allocationKeys.availablePlots(assetId, size),
    queryFn: () =>
      apiGet(`/admin/allocation/assets/${assetId}/available-plots`, z.array(AllocationPlotSchema), {
        params: { size },
      }),
    enabled: enabled && !!assetId,
  });
};
