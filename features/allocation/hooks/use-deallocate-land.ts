'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { AllocateResultSchema } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

export interface DeallocateLandInput {
  paymentPlanId: string;
  /** Required, ≥20 chars — `DeallocatePlotsDto.reason`, `REASON_MIN_LENGTH`. */
  reason: string;
}

/**
 * POST /admin/allocation/payment-plans/:plan_id/deallocate — confirmed
 * against abode-be-v2's allocation module on `origin/staging` (2026-08-28,
 * not yet deployed to this app's target environment). Body: `{ reason }`,
 * required and server-enforced at ≥20 chars — an admin can't skip it.
 */
export const useDeallocateLand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentPlanId, reason }: DeallocateLandInput) =>
      apiPost(
        `/admin/allocation/payment-plans/${paymentPlanId}/deallocate`,
        { reason },
        AllocateResultSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};
