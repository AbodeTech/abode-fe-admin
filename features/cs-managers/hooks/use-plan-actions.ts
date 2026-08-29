'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api-client';

import {
  CustomerOnboardingAttemptSchema,
  MarkDeedDeliveredResultSchema,
  type LogOnboardingCallPayload,
} from '../schemas/cs-manager.schema';
import { csManagerKeys } from './query-keys';
import { z } from 'zod';

/**
 * Per-plan CSM actions — the write half of the dashboard. Both mutations
 * are guarded BE-side (`requireOwningCSMOrSuperAdmin`): only the customer's
 * currently assigned CSM (or a super admin) can write. The FE shows the
 * controls regardless and surfaces the rejection as a toast, since the
 * dashboard doesn't know the viewer's own admin id.
 */

export const useCustomerOnboardingAttempts = (planId: string | null | undefined) =>
  useQuery({
    queryKey: csManagerKeys.onboardingAttempts(planId ?? ''),
    queryFn: () =>
      apiGet(`/admin/payment-plans/${planId}/onboarding-attempts`, z.array(CustomerOnboardingAttemptSchema)),
    enabled: !!planId,
  });

export const useLogOnboardingCall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...payload }: { planId: string } & LogOnboardingCallPayload) =>
      apiPost(`/admin/payment-plans/${planId}/onboarding-attempts`, payload, CustomerOnboardingAttemptSchema),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: csManagerKeys.onboardingAttempts(variables.planId) });
      // A "done" call flips the plan's onboarding status, the onboarded KPI
      // and the onboarding backlog split — refetch every dashboard period.
      queryClient.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
    },
  });
};

export const useMarkDeedDelivered = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiPost(`/admin/payment-plans/${planId}/mark-deed-delivered`, {}, MarkDeedDeliveredResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
    },
  });
};
