'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import {
  OnboardingAttemptSchema,
  type LogOnboardingAttemptPayload,
} from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * POST /admin/pros/:pro_id/onboarding-attempts — log one call.
 *
 * Two BE rules worth surfacing in the UI rather than discovering as a 400:
 *  - a pro who has already been reached (`picked`) is CLOSED to further
 *    attempts — `PRO_ALREADY_ONBOARDED`;
 *  - `rescheduled` requires `reschedule_date` — `RESCHEDULE_DATE_REQUIRED`.
 *
 * `pro_id` is a path segment; sending it in the body is a 400 under
 * `forbidNonWhitelisted`.
 */
export const useLogOnboardingAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ proId, values }: { proId: string; values: LogOnboardingAttemptPayload }) =>
      apiPost(`/admin/pros/${proId}/onboarding-attempts`, values, OnboardingAttemptSchema),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: managerKeys.onboardingAttempts(variables.proId),
      });
      // A `picked` attempt stamps `onboardedAt` on the pro, which moves the
      // dashboard's onboarding queue and the roster's onboarded filters.
      queryClient.invalidateQueries({ queryKey: managerKeys.dashboards() });
    },
  });
};
