'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { YearsListSchema } from '../schemas/tracker.schema';
import { trackerKeys } from './query-keys';

/**
 * GET /admin/associate-pro-tracker/years — the picker's options.
 *
 * Years with goals, unioned with years that saw activity, plus the current year
 * — so the list is never empty on a fresh install.
 */
export const useYearsList = () =>
  useQuery({
    queryKey: trackerKeys.years(),
    queryFn: () => apiGet('/admin/associate-pro-tracker/years', YearsListSchema),
    staleTime: 5 * 60 * 1000,
  });
