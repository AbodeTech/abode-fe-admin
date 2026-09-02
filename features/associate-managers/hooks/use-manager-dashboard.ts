'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  ManagerDashboardSchema,
  type ManagerDashboardParams,
} from '../schemas/manager-dashboard.schema';
import { managerKeys } from './query-keys';

interface DashboardOptions {
  enabled?: boolean;
  keepPreviousData?: boolean;
}

/**
 * GET /admin/managers/:manager_id/dashboard — super-admin view of one
 * manager's team. `managerId` is the ADMIN id.
 */
export const useAdminManagerDashboard = (
  managerId: string | null | undefined,
  params?: ManagerDashboardParams | null,
  options?: DashboardOptions
) =>
  useQuery({
    queryKey: managerKeys.adminDashboard(managerId ?? '', params),
    queryFn: () =>
      apiGet(`/admin/managers/${managerId}/dashboard`, ManagerDashboardSchema, {
        params: params ?? {},
      }),
    enabled: !!managerId && options?.enabled !== false,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });

/**
 * GET /admin/managers/dashboard — the caller's OWN team.
 *
 * Takes no manager id at all: `IsManagerGuard` resolves it from the JWT, so an
 * admin cannot read another manager's team through this route however their
 * permissions are set. A super-admin who manages nobody gets 403 NOT_A_MANAGER
 * — check `useIsCurrentUserManager` before enabling this.
 */
export const useManagerDashboard = (
  params?: ManagerDashboardParams | null,
  options?: DashboardOptions
) =>
  useQuery({
    queryKey: managerKeys.selfDashboard(params),
    queryFn: () =>
      apiGet('/admin/managers/dashboard', ManagerDashboardSchema, { params: params ?? {} }),
    enabled: options?.enabled !== false,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
