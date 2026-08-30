'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  ManagerDashboardSchema,
  type ManagerDashboardParams,
} from '../schemas/manager-dashboard.schema';
import { managerKeys } from './query-keys';

export const DEFAULT_ALL_MANAGERS_LIMIT = 25;

/**
 * GET /admin/managers/dashboard/all — every managed pro, as one roster.
 *
 * Targets are SUMMED across managers for the period (the org's goal), and the
 * per-pro contributor lists are empty by design: org-wide scopes get source
 * attribution instead.
 */
export const useAllManagersDashboard = (
  params?: ManagerDashboardParams | null,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
) =>
  useQuery({
    queryKey: managerKeys.allManagersDashboard(params),
    queryFn: () =>
      apiGet('/admin/managers/dashboard/all', ManagerDashboardSchema, {
        params: { limit: DEFAULT_ALL_MANAGERS_LIMIT, ...(params ?? {}) },
      }),
    enabled: options?.enabled !== false,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
