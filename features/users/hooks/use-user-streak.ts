'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api-client';

import { StreakAdjustResultSchema, UserStreakSchema, type StreakAdjustFormValues } from '../schemas/user-streak.schema';
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
 * value, with a required reason and an audit record. 409 NO_CHANGE when the
 * streak and points are unchanged. Omit points_change to leave points alone.
 */
export const useAdjustUserStreak = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StreakAdjustFormValues) =>
      apiPost(`/admin/users/${userId}/streak/adjust`, payload, StreakAdjustResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.streak(userId) });
    },
  });
};
