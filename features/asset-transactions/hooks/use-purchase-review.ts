'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPost } from '@/lib/api-client';

import { purchaseKeys } from './query-keys';

/**
 * The flex review pair — POST /admin/acquisitions/flex/:txId/approve|decline.
 *
 * Approve settles the transfer: it CREATES the payment plan and PAYS the
 * commission in the same motion, returning the new plan's id. Decline marks
 * the transaction failed and, on an initial purchase, releases the units it
 * was holding.
 *
 * Namespaced under /flex on purpose — when full-ownership purchases exist
 * they get their own family, and the row's `transaction_kind` decides which
 * one a given row calls.
 */
const ApproveResultSchema = z.looseObject({ payment_plan_id: z.string() });
const DeclineResultSchema = z.looseObject({ message: z.string().optional() });

export type ApprovePurchaseResult = z.infer<typeof ApproveResultSchema>;

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

export const useApproveFlexPurchase = () =>
  useInvalidatingMutation((args: { id: string }) =>
    apiPost(`/admin/acquisitions/flex/${args.id}/approve`, {}, ApproveResultSchema)
  );

export const useDeclineFlexPurchase = () =>
  useInvalidatingMutation((args: { id: string; reason: string }) =>
    apiPost(`/admin/acquisitions/flex/${args.id}/decline`, { reason: args.reason }, DeclineResultSchema)
  );
