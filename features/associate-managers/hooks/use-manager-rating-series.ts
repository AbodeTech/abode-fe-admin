'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { RatingSeriesPointSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

export const DEFAULT_RATING_SERIES_MONTHS = 6;

export interface UseManagerRatingSeriesParams {
  /**
   * The manager whose trend to plot. There is no "self" route — a manager
   * viewing their own trend resolves their id from `useIsCurrentUserManager`
   * (backed by `GET /admin/managers/me`) and passes it here.
   */
  managerId: string | null;
  monthsBack?: number;
  enabled?: boolean;
}

/**
 * GET /admin/managers/:manager_id/rating-series — monthly peer-rating averages,
 * oldest first, with unrated months server-filled as `{ average: 0, count: 0 }`
 * so a chart renders every bar.
 *
 * `count` is the only thing separating "nobody rated" from "everyone rated
 * badly" — plot the average, but never present a `count: 0` point as a score.
 */
export const useManagerRatingSeries = ({
  managerId,
  monthsBack = DEFAULT_RATING_SERIES_MONTHS,
  enabled = true,
}: UseManagerRatingSeriesParams) =>
  useQuery({
    queryKey: managerKeys.ratingSeries(managerId ?? '', monthsBack),
    queryFn: () =>
      apiGet(`/admin/managers/${managerId}/rating-series`, z.array(RatingSeriesPointSchema), {
        params: { months_back: monthsBack },
      }),
    enabled: enabled && !!managerId,
    staleTime: 5 * 60 * 1000,
  });
