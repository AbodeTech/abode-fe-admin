'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { TrackerDashboardSchema } from '../schemas/tracker.schema';
import { trackerKeys } from './query-keys';

/**
 * GET /admin/associate-pro-tracker/dashboard?year= — all five metric sections.
 *
 * Always answers, with or without a goal for the year: `goals_set` says which
 * of the two states to render, and the live figures are populated either way.
 * Previous data is kept while a new year loads so the page doesn't blank out
 * between selections.
 */
export const useTrackerDashboard = (year: number) =>
  useQuery({
    queryKey: trackerKeys.dashboard(year),
    queryFn: () =>
      apiGet('/admin/associate-pro-tracker/dashboard', TrackerDashboardSchema, {
        params: { year },
      }),
    placeholderData: keepPreviousData,
  });
