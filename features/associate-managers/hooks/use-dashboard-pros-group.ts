'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  ManagerDashboardSchema,
  type ManagerDashboardParams,
  type ProGroup,
  type ProSort,
} from '../schemas/manager-dashboard.schema';
import { managerKeys } from './query-keys';

export type DashboardProsViewMode = 'self' | 'admin' | 'all-managers' | 'system-associates';

export const DRAWER_PAGE_SIZE = 25;

export interface UseDashboardProsGroupParams {
  viewMode: DashboardProsViewMode;
  managerId: string | null;
  periodFilter: ManagerDashboardParams;
  group: ProGroup;
  sort?: ProSort | null;
  page?: number;
  enabled?: boolean;
}

/** The sort that makes a group readable when the caller hasn't chosen one. */
function defaultSortForGroup(group: ProGroup): ProSort | undefined {
  switch (group) {
    case 'recruited_in_period':
    case 'upgraded_in_period':
    case 'recruited_not_onboarded':
      return 'recruited_desc';
    case 'onboarded_in_period':
      return 'onboarded_at_desc';
    case 'selling_in_period':
    case 'selling':
      return 'sales_desc';
    case 'active_recruiter':
    case 'recruiting':
      return 'last_recruit_desc';
    case 'active_revenue_generator':
      return 'revenue_desc';
    default:
      return undefined;
  }
}

const PATH_BY_VIEW: Record<Exclude<DashboardProsViewMode, 'admin'>, string> = {
  self: '/admin/managers/dashboard',
  'all-managers': '/admin/managers/dashboard/all',
  'system-associates': '/admin/managers/dashboard/system',
};

/**
 * One page of the roster, grouped and sorted — the drawer behind each
 * dashboard stat.
 *
 * Every scope paginates SERVER-side: `DashboardQueryDto` takes `page`/`limit`
 * on all four routes, so unlike the GraphQL version this no longer slices a
 * full roster in the browser.
 */
export const useDashboardProsGroup = ({
  viewMode,
  managerId,
  periodFilter,
  group,
  sort,
  page = 1,
  enabled = true,
}: UseDashboardProsGroupParams) => {
  const proSort = sort ?? defaultSortForGroup(group);
  const params: ManagerDashboardParams = {
    ...periodFilter,
    pro_group: group,
    ...(proSort ? { pro_sort: proSort } : {}),
    page,
    limit: DRAWER_PAGE_SIZE,
  };

  return useQuery({
    queryKey: managerKeys.prosGroup(viewMode, managerId, params),
    queryFn: () => {
      if (viewMode === 'admin') {
        if (!managerId) throw new Error('Manager id is required');
        return apiGet(`/admin/managers/${managerId}/dashboard`, ManagerDashboardSchema, {
          params,
        });
      }
      return apiGet(PATH_BY_VIEW[viewMode], ManagerDashboardSchema, { params });
    },
    enabled: enabled && (viewMode !== 'admin' || !!managerId),
    placeholderData: keepPreviousData,
  });
};
