'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPost } from '@/lib/api-client';

import type { PurchaseReviewFamily } from '../schemas/purchase.schema';
import { purchaseKeys } from './query-keys';

/**
 * Review pair, routed by family:
 *   flex — POST /admin/acquisitions/flex/:txId/approve|decline
 *   FO   — POST /admin/fo/purchase/transactions/:txId/approve|decline
 *
 * Approve settles the transfer: it CREATES the payment plan and PAYS the
 * commission in the same motion. Flex returns `{ payment_plan_id }`; FO
 * returns `{ plan_id }`. Decline marks the transaction failed and, on an
 * initial purchase, releases the units it was holding.
 */
const FlexApproveResultSchema = z.looseObject({ payment_plan_id: z.string() });
const FoApproveResultSchema = z.looseObject({ plan_id: z.string() });
const DeclineResultSchema = z.looseObject({ message: z.string().optional() });

export type ApprovePurchaseResult = { planId: string };

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
    },
  });
}

export const useApprovePurchase = () =>
  useInvalidatingMutation(async (args: { id: string; family: PurchaseReviewFamily }) => {
    if (args.family === 'flex') {
      const result = await apiPost(
        `/admin/acquisitions/flex/${args.id}/approve`,
        {},
        FlexApproveResultSchema
      );
      return { planId: result.payment_plan_id } satisfies ApprovePurchaseResult;
    }

    const result = await apiPost(
      `/admin/fo/purchase/transactions/${args.id}/approve`,
      {},
      FoApproveResultSchema
    );
    return { planId: result.plan_id } satisfies ApprovePurchaseResult;
  });

export const useDeclinePurchase = () =>
  useInvalidatingMutation((args: { id: string; family: PurchaseReviewFamily; reason: string }) => {
    const path =
      args.family === 'flex'
        ? `/admin/acquisitions/flex/${args.id}/decline`
        : `/admin/fo/purchase/transactions/${args.id}/decline`;
    return apiPost(path, { reason: args.reason }, DeclineResultSchema);
  });
