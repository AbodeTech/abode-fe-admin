'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { MarketplaceListingSchema } from '../schemas/marketplace.schema';
import { marketplaceKeys, type MarketplaceListFilters } from './query-keys';

/** The BE defaults to 20. */
export const DEFAULT_MARKETPLACE_LISTINGS_LIMIT = 20;

/**
 * GET /admin/marketplace/listings — standard paged envelope, verified live
 * 2026-08-20. Only `status` is filterable server-side — `AdminListingsQueryDto`
 * has no `asset_type` field, unlike the old GraphQL filter input (ticket #27).
 */
export const useMarketplaceListings = (filters?: MarketplaceListFilters) => {
  const { page = 1, limit = DEFAULT_MARKETPLACE_LISTINGS_LIMIT, status } = filters ?? {};

  return useQuery({
    queryKey: marketplaceKeys.list({ page, limit, status }),
    queryFn: () =>
      apiGetPaged('/admin/marketplace/listings', MarketplaceListingSchema, {
        params: { page, limit, status: status || undefined },
      }),
  });
};

/** GET /admin/marketplace/pending-approvals — receipt-path listings awaiting a decision. */
export const usePendingApprovals = (filters?: { page?: number; limit?: number }) => {
  const { page = 1, limit = DEFAULT_MARKETPLACE_LISTINGS_LIMIT } = filters ?? {};

  return useQuery({
    queryKey: marketplaceKeys.pendingApprovals({ page, limit }),
    queryFn: () =>
      apiGetPaged('/admin/marketplace/pending-approvals', MarketplaceListingSchema, {
        params: { page, limit },
      }),
  });
};
