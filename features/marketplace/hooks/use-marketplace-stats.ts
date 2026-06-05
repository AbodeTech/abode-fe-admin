import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { marketplaceKeys } from './query-keys';

const GET_MARKETPLACE_DASHBOARD_QUERY = `
  query GetMarketplaceDashboard {
    getMarketplaceDashboard {
      total_listings
      active_listings
      sold_listings
      pending_approval_listings
      cancelled_listings
      expired_listings
      suspended_listings
      total_volume
      total_platform_fees
      total_referral_commissions
    }
  }
`;

export interface MarketplaceStats {
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  pending_approval_listings: number;
  cancelled_listings: number;
  expired_listings: number;
  suspended_listings: number;
  total_volume: number;
  total_platform_fees: number;
  total_referral_commissions: number;
}

interface StatsResponse {
  getMarketplaceDashboard: MarketplaceStats;
}

export const useMarketplaceStats = () => {
  return useQuery({
    queryKey: marketplaceKeys.stats(),
    queryFn: () => executeRaw<StatsResponse>(GET_MARKETPLACE_DASHBOARD_QUERY),
    select: (data) => data.getMarketplaceDashboard,
  });
};
