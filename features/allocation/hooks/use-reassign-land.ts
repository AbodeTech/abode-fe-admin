'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { AllocateResultSchema } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

export interface ReassignLandInput {
  paymentPlanId: string;
  newPlotIds: string[];
  /** Required, ≥20 chars — `ReassignPlotsDto.reason`, `REASON_MIN_LENGTH`. */
  reason: string;
}

/**
 * POST /admin/allocation/payment-plans/:plan_id/reassign — confirmed against
 * abode-be-v2's allocation module on `origin/staging` (2026-08-28, not yet
 * deployed to this app's target environment). Body: `{ new_plot_ids, reason }`
 * — `reason` is required and server-enforced at ≥20 chars, same as deallocate.
 *
 * Atomic release-then-claim server-side: a failed new claim rolls the old
 * release back, so the old plots stay allocated exactly as before on failure.
 */
export const useReassignLand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentPlanId, newPlotIds, reason }: ReassignLandInput) =>
      apiPost(
        `/admin/allocation/payment-plans/${paymentPlanId}/reassign`,
        { new_plot_ids: newPlotIds, reason },
        AllocateResultSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};
