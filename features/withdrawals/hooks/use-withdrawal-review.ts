'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPatch, apiPost } from '@/lib/api-client';

import {
  AdminStatusSchema,
  type PaymentProvider,
} from '../schemas/withdrawal.schema';
import { withdrawalKeys } from './query-keys';

/**
 * Approve returns the updated transaction, and the caller MUST read
 * `admin_status` off it: the endpoint 200s even when the payment rail
 * refuses the transfer — the row lands in `approved-retry-needed` instead of
 * `approved`, and money has NOT moved. Toasting a plain "approved" on every
 * 200 would tell the admin a lie for exactly the case they most need to see.
 */
const ApproveResultSchema = z.looseObject({
  _id: z.string(),
  admin_status: AdminStatusSchema.nullable().optional(),
  rail_attempts: z
    .array(z.looseObject({ error: z.looseObject({ message: z.string() }) }))
    .optional(),
});

export type ApproveResult = z.infer<typeof ApproveResultSchema>;

/** Decline releases the hold — the money returns to the user's balance. */
const DeclineResultSchema = z.looseObject({ released: z.boolean() });

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.lists() });
    },
  });
}

export const useApproveWithdrawal = () =>
  useInvalidatingMutation((args: { id: string; overrideProvider?: PaymentProvider }) =>
    apiPatch(
      `/admin/withdrawals/${args.id}/approve`,
      args.overrideProvider ? { override_provider: args.overrideProvider } : {},
      ApproveResultSchema
    )
  );

export const useDeclineWithdrawal = () =>
  useInvalidatingMutation((args: { id: string; reason: string }) =>
    apiPatch(`/admin/withdrawals/${args.id}/decline`, { reason: args.reason }, DeclineResultSchema)
  );

/** Same shape as approve — a retry is another run at the rail. */
export const useRetryWithdrawal = () =>
  useInvalidatingMutation(
    (args: { id: string; reason: string; overrideProvider?: PaymentProvider }) =>
      apiPost(
        `/admin/withdrawals/${args.id}/retry`,
        {
          reason: args.reason,
          ...(args.overrideProvider ? { override_provider: args.overrideProvider } : {}),
        },
        ApproveResultSchema
      )
  );
