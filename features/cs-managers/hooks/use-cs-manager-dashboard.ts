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
  /** Name, email, asset — or a phone number, as 4+ digits in any spacing. */
  search?: string;
  /**
   * Estate name, matched whole and case-insensitively. Narrows the plans table
   * and its chip counts, never the targets, backlogs or portfolio.
   */
  estate?: string;
  sort?: PlanSortKey;
  enabled?: boolean;
}

/** GET /admin/cs-managers/:manager_id/dashboard (or `dashboard/all`) — CSM-21/CSM-39. */
export const useCSManagerDashboard = ({
  managerId,
  month,
  year,
  page = 1,
  limit = 20,
  filter,
  search,
  estate,
  sort,
  enabled = true,
}: DashboardParams) =>
  useQuery({
    queryKey: csManagerKeys.dashboard(managerId, { month, year, page, limit, filter, search, estate, sort }),
    queryFn: () =>
      apiGet(managerId === "all" ? "/admin/cs-managers/dashboard/all" : `/admin/cs-managers/${managerId}/dashboard`, CSManagerDashboardSchema, {
        params: {
          month,
          year,
          page,
          limit,
          filter,
          search: search?.trim() || undefined,
          estate: estate?.trim() || undefined,
          sort,
        },
      }),
    enabled: enabled && !!managerId,
    placeholderData: keepPreviousData,
  });
