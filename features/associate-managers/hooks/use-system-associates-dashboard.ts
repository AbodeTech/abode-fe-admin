'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  ManagerDashboardSchema,
  type ManagerDashboardParams,
} from '../schemas/manager-dashboard.schema';
import { managerKeys } from './query-keys';

export const DEFAULT_SYSTEM_ASSOCIATES_LIMIT = 25;

/**
 * GET /admin/managers/dashboard/system — the whole associate tier as a single
 * virtual roster.
 *
 * No human manager owns this tier, so nobody set a goal: every target comes
 * back as 0, and the peer rating is 0/0. Don't render those as missed targets.
 */
export const useSystemAssociatesDashboard = (
  params?: ManagerDashboardParams | null,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
) =>
  useQuery({
    queryKey: managerKeys.systemDashboard(params),
    queryFn: () =>
      apiGet('/admin/managers/dashboard/system', ManagerDashboardSchema, {
        params: { limit: DEFAULT_SYSTEM_ASSOCIATES_LIMIT, ...(params ?? {}) },
      }),
    enabled: options?.enabled !== false,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
