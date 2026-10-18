'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiClientError, apiPost } from '@/lib/api-client';

import { purchaseKeys } from './query-keys';

/**
 * Unified review pair:
 *   POST /admin/acquisitions/transactions/:txId/approve
 *   POST /admin/acquisitions/transactions/:txId/decline
 *
 * The BE routes by transaction kind (flex vs full-ownership). Approve settles
 * the transfer: it CREATES the payment plan and PAYS the commission in the
 * same motion. Flex returns `{ payment_plan_id }`; FO returns `{ plan_id }`.
 * Decline marks the transaction failed and, on an initial purchase, releases
 * the units it was holding. Decline body is `{ reason }` (min 20 chars).
 *
 * Both return 409 `TRANSACTION_ALREADY_DECIDED` when another admin approved or
 * declined the same transaction a moment earlier (FINANCIAL-OFFICER PRE-1).
 */

/** Someone else decided this transaction first; the list we're showing is stale. */
export const isAlreadyDecided = (error: unknown) =>
  error instanceof ApiClientError && error.statusCode === 409;
const ApproveResultSchema = z.looseObject({
  payment_plan_id: z.string().optional(),
  plan_id: z.string().optional(),
});
const DeclineResultSchema = z.looseObject({ message: z.string().optional() });

export type ApprovePurchaseResult = { planId: string };

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
    onError: (error) => {
      if (isAlreadyDecided(error)) queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });
}

export const useApprovePurchase = () =>
  useInvalidatingMutation(async (args: { id: string }) => {
    const result = await apiPost(
      `/admin/acquisitions/transactions/${args.id}/approve`,
      {},
      ApproveResultSchema
    );
    return {
      planId: result.plan_id ?? result.payment_plan_id ?? '',
    } satisfies ApprovePurchaseResult;
  });

export const useDeclinePurchase = () =>
  useInvalidatingMutation((args: { id: string; reason: string }) =>
    apiPost(
      `/admin/acquisitions/transactions/${args.id}/decline`,
      { reason: args.reason },
      DeclineResultSchema
    )
  );
