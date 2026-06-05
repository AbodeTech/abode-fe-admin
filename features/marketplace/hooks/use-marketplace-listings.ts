import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { marketplaceKeys } from './query-keys';

const VIEW_ALL_LISTINGS_QUERY = `
  query ViewAllMarketplaceListings($filters: AdminMarketplaceFilterInput) {
    viewAllMarketplaceListings(filters: $filters) {
      listings {
        _id
        seller { _id firstName lastName }
        buyer { _id firstName lastName }
        asset { _id asset_name asset_location asset_type }
        listing_price
        commission_percentage
        platform_fee
        referral_commission
        seller_proceeds
        no_of_units
        unique_asset_id
        asset_type
        status
        listed_at
        expires_at
        sold_at
        cancelled_at
        receipt_image
        receipt_amount
        receipt_reference
        suspended_reason
        createdAt
      }
      pagination {
        currentPage
        totalPages
        totalCount
        limit
      }
    }
  }
`;

const VIEW_PENDING_APPROVALS_QUERY = `
  query ViewPendingMarketplaceApprovals($page: Int, $limit: Int) {
    viewPendingMarketplaceApprovals(page: $page, limit: $limit) {
      listings {
        _id
        seller { _id firstName lastName }
        buyer { _id firstName lastName }
        asset { _id asset_name asset_location asset_type }
        listing_price
        commission_percentage
        platform_fee
        referral_commission
        seller_proceeds
        no_of_units
        unique_asset_id
        asset_type
        status
        listed_at
        receipt_image
        receipt_amount
        receipt_reference
        createdAt
      }
      pagination {
        currentPage
        totalPages
        totalCount
        limit
      }
    }
  }
`;

export interface MarketplaceListingAdmin {
  _id: string;
  seller: { _id: string; firstName: string; lastName: string } | null;
  buyer: { _id: string; firstName: string; lastName: string } | null;
  asset: { _id: string; asset_name: string; asset_location: string; asset_type: string } | null;
  listing_price: number;
  commission_percentage: number;
  platform_fee: number;
  referral_commission: number;
  seller_proceeds: number;
  no_of_units: number;
  unique_asset_id: string;
  asset_type: string;
  status: string;
  listed_at: string;
  expires_at: string;
  sold_at: string | null;
  cancelled_at: string | null;
  receipt_image: string | null;
  receipt_amount: number | null;
  receipt_reference: string | null;
  suspended_reason: string | null;
  createdAt: string;
}

export interface MarketplacePagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface ListingsResponse {
  viewAllMarketplaceListings: {
    listings: MarketplaceListingAdmin[];
    pagination: MarketplacePagination;
  };
}

interface PendingApprovalsResponse {
  viewPendingMarketplaceApprovals: {
    listings: MarketplaceListingAdmin[];
    pagination: MarketplacePagination;
  };
}

interface UseMarketplaceListingsParams {
  page?: number;
  limit?: number;
  status?: string;
  asset_type?: string;
}

export const useMarketplaceListings = (params?: UseMarketplaceListingsParams) => {
  const { page = 1, limit = 20, ...filters } = params ?? {};

  return useQuery({
    queryKey: marketplaceKeys.list({ page, limit, ...filters }),
    queryFn: () =>
      executeRaw<ListingsResponse>(VIEW_ALL_LISTINGS_QUERY, {
        filters: { page, limit, ...filters },
      }),
    select: (data) => data.viewAllMarketplaceListings,
  });
};

export const usePendingApprovals = (params?: { page?: number; limit?: number }) => {
  const { page = 1, limit = 20 } = params ?? {};

  return useQuery({
    queryKey: marketplaceKeys.pendingApprovals({ page, limit }),
    queryFn: () =>
      executeRaw<PendingApprovalsResponse>(VIEW_PENDING_APPROVALS_QUERY, {
        page,
        limit,
      }),
    select: (data) => data.viewPendingMarketplaceApprovals,
  });
};
