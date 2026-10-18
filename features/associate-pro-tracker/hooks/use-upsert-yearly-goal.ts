'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPut } from '@/lib/api-client';

import {
  YearlyGoalSchema,
  type UpsertYearlyGoalPayload,
} from '../schemas/tracker.schema';
import { trackerKeys } from './query-keys';

/**
 * PUT /admin/associate-pro-tracker/goals/:year — set or revise a year's goals.
 *
 * Allowed all year and never locked; the BE audits each change with before and
 * after, so a mid-year revision is a normal action. The years list is
 * invalidated too: setting a goal on a year that had no activity is what puts
 * that year in the picker.
 */
export const useUpsertYearlyGoal = (year: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertYearlyGoalPayload) =>
      apiPut(`/admin/associate-pro-tracker/goals/${year}`, payload, YearlyGoalSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.dashboard(year) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.goal(year) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.years() });
    },
  });
};
