'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import {
  AdminUserAssociateProSchema,
  AdminUserBankDetailsSchema,
  AdminUserCampaignStandingsSchema,
  AdminUserCoreSchema,
  AdminUserDetailRowSchema,
  AdminUserKycSchema,
  AdminUserStatsSchema,
} from '../schemas/user-detail.schema';
import { toUserAsset, toUserDetail, toUserTransaction } from '../lib/map-user-detail';
import { userKeys } from './query-keys';

const DETAIL_PAGE_LIMIT = 100;

export function useUserCore(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiGet(`/admin/users/${id}`, AdminUserCoreSchema),
    enabled: !!id,
  });
}

export function useUserStats(id: string) {
  return useQuery({
    queryKey: userKeys.stats(id),
    queryFn: () => apiGet(`/admin/users/${id}/stats`, AdminUserStatsSchema),
    enabled: !!id,
  });
}

/** Core + stats merged into the shape the existing detail cards already render. */
export function useUserDetails(id: string) {
  const core = useUserCore(id);
  const stats = useUserStats(id);

  return {
    ...core,
    data: core.data ? toUserDetail(core.data, stats.data) : undefined,
    isStatsLoading: stats.isLoading,
  };
}

export function useUserKyc(id: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.kyc(id),
    queryFn: () => apiGet(`/admin/users/${id}/kyc`, AdminUserKycSchema),
    enabled: !!id && enabled,
  });
}

export function useUserBankDetails(id: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.bank(id),
    queryFn: () => apiGet(`/admin/users/${id}/bank-details`, AdminUserBankDetailsSchema),
    enabled: !!id && enabled,
  });
}

export function useUserDetailAssets(id: string) {
  return useQuery({
    queryKey: userKeys.assets(id, { page: 1, limit: DETAIL_PAGE_LIMIT }),
    queryFn: async () => {
      const { items } = await apiGetPaged(
        `/admin/users/${id}/assets`,
        AdminUserDetailRowSchema,
        { params: { page: 1, limit: DETAIL_PAGE_LIMIT } }
      );
      return items.map(toUserAsset);
    },
    enabled: !!id,
  });
}

export function useUserDetailTransactions(
  id: string,
  category: 'commission' | 'other' | 'all' = 'all'
) {
  return useQuery({
    queryKey: userKeys.transactions(id, { category, page: 1, limit: DETAIL_PAGE_LIMIT }),
    queryFn: async () => {
      const { items } = await apiGetPaged(
        `/admin/users/${id}/transactions`,
        AdminUserDetailRowSchema,
        { params: { page: 1, limit: DETAIL_PAGE_LIMIT, category } }
      );
      return items.map(toUserTransaction);
    },
    enabled: !!id,
  });
}

export function useUserAssociatePro(id: string) {
  return useQuery({
    queryKey: userKeys.associatePro(id),
    queryFn: () => apiGet(`/admin/users/${id}/associate-pro`, AdminUserAssociateProSchema),
    enabled: !!id,
  });
}

export function useUserCampaignStandings(id: string) {
  return useQuery({
    queryKey: userKeys.campaigns(id),
    queryFn: () =>
      apiGet(`/admin/users/${id}/campaign-standings`, AdminUserCampaignStandingsSchema),
    enabled: !!id,
  });
}

export type UserDetailsData = NonNullable<ReturnType<typeof useUserDetails>['data']>;
