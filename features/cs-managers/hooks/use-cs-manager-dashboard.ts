'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  CSManagerDashboardSchema,
  type PlanFilterKey,
  type PlanSortKey,
} from '../schemas/cs-manager.schema';
import { csManagerKeys } from './query-keys';

export interface DashboardParams {
  managerId: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  filter?: PlanFilterKey;
  search?: string;
  sort?: PlanSortKey;
  enabled?: boolean;
}

/** GET /admin/cs-managers/:manager_id/dashboard — CSM-21/CSM-39. */
export const useCSManagerDashboard = ({
  managerId,
  month,
  year,
  page = 1,
  limit = 20,
  filter,
  search,
  sort,
  enabled = true,
}: DashboardParams) =>
  useQuery({
    queryKey: csManagerKeys.dashboard(managerId, { month, year, page, limit, filter, search, sort }),
    queryFn: () =>
      apiGet(`/admin/cs-managers/${managerId}/dashboard`, CSManagerDashboardSchema, {
        params: { month, year, page, limit, filter, search: search || undefined, sort },
      }),
    enabled: enabled && !!managerId,
    placeholderData: keepPreviousData,
  });
