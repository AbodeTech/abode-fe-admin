'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api-client';

import { StreakAdjustResultSchema, UserStreakSchema } from '../schemas/user-streak.schema';
import { userKeys } from './query-keys';

/** GET /admin/users/:id/streak — the Streaks & Points card on the Summary. */
export const useUserStreak = (userId: string) =>
  useQuery({
    queryKey: userKeys.streak(userId),
    queryFn: () => apiGet(`/admin/users/${userId}/streak`, UserStreakSchema),
    enabled: Boolean(userId),
  });

/**
 * POST /admin/users/:id/streak/adjust — sets the current streak to the given
 * value, with a required reason and an audit record. `points_change` is
 * optional: send it only to correct points (it can be negative, and the backend
 * refuses a result below zero with 409 POINTS_BELOW_ZERO). 409 NO_CHANGE when
 * the streak already has that value and no points change was sent.
 */
export const useAdjustUserStreak = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { current_streak: number; reason: string; points_change?: number }) =>
      apiPost(`/admin/users/${userId}/streak/adjust`, payload, StreakAdjustResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.streak(userId) });
    },
  });
};
