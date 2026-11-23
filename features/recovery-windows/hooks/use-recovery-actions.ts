"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPost } from "@/lib/api-client";

import {
  AckSchema,
  RecoveryDetailSchema,
  SendTermsResponseSchema,
  type SendTermsPayload,
} from "../schemas/recovery-window.schema";
import { recoveryKeys } from "./query-keys";

/* ============================================================
 * Recovery record actions. Every one re-reads the list, stats and the
 * record. Toasts belong to the call-site.
 * ============================================================ */

function useRecoveryMutation<TInput>(run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recoveryKeys.all }),
  });
}

export const useSendRecoveryReminder = () =>
  useRecoveryMutation((input: { id: string }) =>
    apiPost(`/admin/recovery-windows/${input.id}/remind`, {}, AckSchema)
  );

export const useSendRecoveryTerms = () =>
  useRecoveryMutation((input: { id: string; payload: SendTermsPayload }) =>
    apiPost(`/admin/recovery-windows/${input.id}/terms`, input.payload, SendTermsResponseSchema)
  );

export const useDeclineRecoveryChoice = () =>
  useRecoveryMutation((input: { id: string; customer_note: string; internal_reason: string }) =>
    apiPost(
      `/admin/recovery-windows/${input.id}/choice/decline`,
      { customer_note: input.customer_note, internal_reason: input.internal_reason },
      AckSchema
    )
  );

export const useAdjustRecoveryRefund = () =>
  useRecoveryMutation(
    (input: { id: string; amount: number; reason: string; expected_updated_at?: string }) =>
      apiPost(
        `/admin/recovery-windows/${input.id}/refund/adjust`,
        {
          amount: input.amount,
          reason: input.reason,
          ...(input.expected_updated_at ? { expected_updated_at: input.expected_updated_at } : {}),
        },
        RecoveryDetailSchema
      )
  );

export const useHoldRecoveryRefund = () =>
  useRecoveryMutation((input: { id: string; reason: string }) =>
    apiPost(`/admin/recovery-windows/${input.id}/refund/hold`, { reason: input.reason }, RecoveryDetailSchema)
  );

export const useReleaseRecoveryRefund = () =>
  useRecoveryMutation((input: { id: string; reason: string }) =>
    apiPost(`/admin/recovery-windows/${input.id}/refund/release`, { reason: input.reason }, RecoveryDetailSchema)
  );

export const useApproveRecoveryRefund = () =>
  useRecoveryMutation((input: { id: string; expected_updated_at?: string }) =>
    apiPost(
      `/admin/recovery-windows/${input.id}/refund/approve`,
      input.expected_updated_at ? { expected_updated_at: input.expected_updated_at } : {},
      RecoveryDetailSchema
    )
  );
