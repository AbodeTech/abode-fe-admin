'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { SendAllocationEmailResultSchema } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

/**
 * POST /admin/allocation/payment-plans/:plan_id/send-email — confirmed
 * against abode-be-v2's allocation module on `origin/staging` (2026-08-28,
 * not yet deployed to this app's target environment). No request body.
 *
 * ⚠️ Known backend gap: the endpoint always returns `queued: true`, but the
 * email queue has no handler for its `allocation-document` job type — see
 * the note on `SendAllocationEmailResultSchema`. Toast success here is
 * "the request was accepted", not "the email arrived".
 */
export const useSendAllocationEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentPlanId: string) =>
      apiPost(
        `/admin/allocation/payment-plans/${paymentPlanId}/send-email`,
        {},
        SendAllocationEmailResultSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};
