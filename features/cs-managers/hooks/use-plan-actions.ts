"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { LogOnboardingCallInput } from "@/lib/gql/graphql";
import { csManagerKeys } from "./use-cs-manager-dashboard";

/**
 * Per-plan CSM actions — the write half of the CS dashboard.
 * BE contract: guidelines/CS_Manager_Dashboard.md §3 (onboarding calls) and
 * §4 (Deed of Assignment).
 *
 * Both mutations are guarded BE-side by requireOwningCSMOrSuperAdmin: only the
 * customer's currently assigned CSM (or a super admin) can write. The FE shows
 * the controls regardless and surfaces the rejection as a toast, since the
 * dashboard doesn't know the viewer's own admin id.
 */

const LIST_CUSTOMER_ONBOARDING_ATTEMPTS_QUERY = graphql(`
  query ListCustomerOnboardingAttempts($paymentPlanId: ID!) {
    listOnboardingAttempts(paymentPlanId: $paymentPlanId) {
      _id
      payment_plan
      customer
      csm
      outcome
      land_choice_reason
      notes
      called_at
      createdAt
    }
  }
`);

const LOG_ONBOARDING_CALL_MUTATION = graphql(`
  mutation LogOnboardingCall($input: LogOnboardingCallInput!) {
    logOnboardingCall(input: $input) {
      _id
      payment_plan
      outcome
      land_choice_reason
      notes
      called_at
    }
  }
`);

const MARK_DEED_DELIVERED_MUTATION = graphql(`
  mutation MarkDeedDelivered($paymentPlanId: ID!) {
    markDeedDelivered(paymentPlanId: $paymentPlanId) {
      paymentPlanId
      deedDeliveredAt
      deedDeliveredBy
    }
  }
`);

export const planActionKeys = {
  attempts: (planId: string) =>
    ["cs-manager", "onboarding-attempts", planId] as const,
};

export const useCustomerOnboardingAttempts = (
  planId: string | null | undefined
) =>
  useQuery({
    queryKey: planActionKeys.attempts(planId ?? ""),
    queryFn: () =>
      execute(LIST_CUSTOMER_ONBOARDING_ATTEMPTS_QUERY, {
        paymentPlanId: planId as string,
      }),
    select: (data) => data.listOnboardingAttempts,
    enabled: !!planId,
  });

export const useLogOnboardingCall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LogOnboardingCallInput) =>
      execute(LOG_ONBOARDING_CALL_MUTATION, { input }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: planActionKeys.attempts(variables.paymentPlanId),
      });
      // A "done" call flips the plan's onboarding status, the onboarded KPI and
      // the onboarding backlog split — refetch every dashboard period.
      qc.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
    },
  });
};

export const useMarkDeedDelivered = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentPlanId: string) =>
      execute(MARK_DEED_DELIVERED_MUTATION, { paymentPlanId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
    },
  });
};

export type { LogOnboardingCallInput };
