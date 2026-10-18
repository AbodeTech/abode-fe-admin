'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiClientError, apiGet } from '@/lib/api-client';

import { YearlyGoalSchema, type YearlyGoal } from '../schemas/tracker.schema';
import { trackerKeys } from './query-keys';

/**
 * GET /admin/associate-pro-tracker/goals/:year — one year's targets.
 *
 * The BE 404s when no goal is set, which is an ordinary state here rather than
 * an error, so it resolves to `null`. The dashboard's `goals_set` is the flag
 * to branch the UI on; this hook exists to PRE-FILL the edit dialog.
 */
export const useYearlyGoal = (year: number, options?: { enabled?: boolean }) =>
  useQuery<YearlyGoal | null>({
    queryKey: trackerKeys.goal(year),
    queryFn: async () => {
      try {
        return await apiGet(`/admin/associate-pro-tracker/goals/${year}`, YearlyGoalSchema);
      } catch (err) {
        if (err instanceof ApiClientError && err.statusCode === 404) return null;
        throw err;
      }
    },
    enabled: options?.enabled !== false,
  });
