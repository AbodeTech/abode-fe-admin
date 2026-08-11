"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

import { purchaseConfirmationKeys } from "./query-keys";

/* ============================================================
 * Admin actions on a purchase confirmation.
 *
 * - resolvePurchaseDispute: stamps the dispute resolved (admin logs),
 *   returns the plan to "waiting"; when requestReconfirm is true the BE
 *   re-sends the confirmation email with the same link. Resolve can
 *   never mark a purchase confirmed — only the buyer can.
 * - resendPurchaseConfirmationEmail: re-sends the confirmation email
 *   for a waiting purchase.
 * ============================================================ */

const RESOLVE_PURCHASE_DISPUTE_MUTATION = graphql(`
  mutation ResolvePurchaseDispute(
    $planId: ID!
    $note: String!
    $requestReconfirm: Boolean
  ) {
    resolvePurchaseDispute(
      planId: $planId
      note: $note
      requestReconfirm: $requestReconfirm
    ) {
      planId
      status
      resent
    }
  }
`);

const RESEND_PURCHASE_CONFIRMATION_EMAIL_MUTATION = graphql(`
  mutation ResendPurchaseConfirmationEmail($planId: ID!) {
    resendPurchaseConfirmationEmail(planId: $planId)
  }
`);

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      planId: string;
      note: string;
      requestReconfirm: boolean;
    }) => execute(RESOLVE_PURCHASE_DISPUTE_MUTATION, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseConfirmationKeys.all });
    },
  });
}

export function useResendConfirmationEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string }) =>
      execute(RESEND_PURCHASE_CONFIRMATION_EMAIL_MUTATION, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseConfirmationKeys.all });
    },
  });
}
