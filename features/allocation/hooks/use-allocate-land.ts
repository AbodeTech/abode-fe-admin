'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { AllocateResultSchema } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

export interface AllocateLandInput {
  paymentPlanId: string;
  plotIds: string[];
  reason?: string;
}

/**
 * POST /admin/allocation/payment-plans/:plan_id/allocate — confirmed against
 * abode-be-v2's allocation module on `origin/staging` (2026-08-28, not yet
 * deployed to this app's target environment). Body: `{ plot_ids, reason? }`.
 *
 * `warnings` in the response is non-empty only for a `developer_plot` asset
 * — every other asset type gets a hard 400 (`SIZE_MISMATCH`) instead, thrown
 * as an `ApiClientError` the caller can read `.code` off.
 */
export const useAllocateLand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentPlanId, plotIds, reason }: AllocateLandInput) =>
      apiPost(
        `/admin/allocation/payment-plans/${paymentPlanId}/allocate`,
        { plot_ids: plotIds, ...(reason ? { reason } : {}) },
        AllocateResultSchema
      ),
    onSuccess: () => {
      // allocationKeys.all covers both the eligible-clients list and every
      // availablePlots query — both key factories nest under ['allocation'].
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};
