import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import {
  AdminUserRowSchema,
  UserOverviewSchema,
  normalizeAdminUserRow,
} from '../schemas/user.schema';
import { boolQuery, bothOrNeitherDates } from '../utils/admin-users-query';
import { userKeys } from './query-keys';

export const DEFAULT_USERS_LIMIT = 10;

export type UsersListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  howYouHeard?: string;
  hasAsset?: boolean;
  hasReferral?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * GET /admin/users — admin-users module (search, tier, how_you_hear_about_us,
 * has_asset, has_referral, date_from/date_to, sort_by/sort_order, page, limit).
 */
export const useUsers = (filters?: UsersListFilters) => {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_USERS_LIMIT;
  const dateRange = bothOrNeitherDates(filters?.dateFrom, filters?.dateTo);

  return useQuery({
    queryKey: userKeys.list({
      page,
      limit,
      search: filters?.search,
      tier: filters?.tier,
      howYouHeard: filters?.howYouHeard,
      hasAsset: filters?.hasAsset,
      hasReferral: filters?.hasReferral,
      dateFrom: dateRange.date_from,
      dateTo: dateRange.date_to,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    }),
    queryFn: () =>
      apiGetPaged('/admin/users', AdminUserRowSchema, {
        params: {
          page,
          limit,
          search: filters?.search?.trim() || undefined,
          tier: filters?.tier || undefined,
          how_you_hear_about_us: filters?.howYouHeard || undefined,
          has_asset: boolQuery(filters?.hasAsset),
          has_referral: boolQuery(filters?.hasReferral),
          ...dateRange,
          sort_by: filters?.sortBy || undefined,
          sort_order: filters?.sortOrder || undefined,
        },
      }),
    select: (data) => ({
      items: data.items.map(normalizeAdminUserRow),
      meta: data.meta,
    }),
  });
};

/**
 * GET /admin/users/overview — 14 period-aware tiles.
 * date_from / date_to are both-or-neither.
 */
export const useSystemUsersOverview = (params?: { startDate?: string; endDate?: string }) => {
  const dateRange = bothOrNeitherDates(params?.startDate, params?.endDate);

  return useQuery({
    queryKey: [...userKeys.overview(), dateRange],
    queryFn: () =>
      apiGet('/admin/users/overview', UserOverviewSchema, {
        params: dateRange,
      }),
  });
};

export type UsersData = NonNullable<ReturnType<typeof useUsers>['data']>;
export type SystemUsersOverviewData = NonNullable<ReturnType<typeof useSystemUsersOverview>['data']>;
