"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPost } from "@/lib/api-client";

import {
  ResendResponseSchema,
  ResolveDisputeResponseSchema,
} from "../schemas/purchase-confirmation.schema";
import { purchaseConfirmationKeys } from "./query-keys";

/* ============================================================
 * Admin actions on a purchase confirmation, POST /admin/purchase-
 * confirmations/:plan_id/*.
 *
 * - resolveDispute: closes every open dispute on the plan (admin-logged),
 *   returns it to "waiting"; requestReconfirm re-sends the confirmation
 *   email with the same link. Never marks a purchase confirmed — only the
 *   buyer can.
 * - resendConfirmationEmail: refreshes the snapshot and re-sends the
 *   confirmation email for a waiting purchase.
 * ============================================================ */

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string; note: string; requestReconfirm: boolean }) =>
      apiPost(
        `/admin/purchase-confirmations/${input.planId}/resolve-dispute`,
        { note: input.note, request_reconfirm: input.requestReconfirm },
        ResolveDisputeResponseSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseConfirmationKeys.all });
    },
  });
}

export function useResendConfirmationEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string }) =>
      apiPost(`/admin/purchase-confirmations/${input.planId}/resend`, {}, ResendResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseConfirmationKeys.all });
    },
  });
}
