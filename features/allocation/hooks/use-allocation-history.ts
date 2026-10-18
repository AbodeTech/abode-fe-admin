'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { AllocationHistoryRowSchema } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

export const DEFAULT_ALLOCATION_HISTORY_LIMIT = 20;

export interface UseAllocationHistoryParams {
  paymentPlanId: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * GET /admin/allocation/payment-plans/:plan_id/history — paginated
 * AllocationHistory for a plan, newest first. Confirmed against
 * abode-be-v2's allocation module on `origin/staging` (2026-08-28, not yet
 * deployed to this app's target environment).
 *
 * `user` / `actor` on each row are bare ObjectId strings — the repository
 * doesn't populate them. Render with the em-dash + copyable-id pattern
 * (`UnresolvedRef`) used elsewhere for the same gap, not as a name.
 */
export const useAllocationHistory = ({
  paymentPlanId,
  page = 1,
  limit = DEFAULT_ALLOCATION_HISTORY_LIMIT,
  enabled = true,
}: UseAllocationHistoryParams) => {
  return useQuery({
    queryKey: allocationKeys.history(paymentPlanId, page, limit),
    queryFn: () =>
      apiGetPaged(
        `/admin/allocation/payment-plans/${paymentPlanId}/history`,
        AllocationHistoryRowSchema,
        { params: { page, limit } }
      ),
    enabled: enabled && !!paymentPlanId,
  });
};
