'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import {
  OnboardingAttemptSchema,
  type OnboardingAttempt,
} from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * GET /admin/pros/:pro_id/onboarding-attempts — a pro's call history,
 * newest first.
 *
 * PRO-scoped, not manager-scoped: the history belongs to the pro and survives
 * every reassignment. `attempt_number` and `is_overdue` are computed on read,
 * never stored.
 */
export const useOnboardingAttempts = (proId: string | null | undefined) =>
  useQuery({
    queryKey: managerKeys.onboardingAttempts(proId || ''),
    queryFn: () =>
      apiGet(`/admin/pros/${proId}/onboarding-attempts`, z.array(OnboardingAttemptSchema)),
    enabled: Boolean(proId),
  });

export type OnboardingAttemptData = OnboardingAttempt;
