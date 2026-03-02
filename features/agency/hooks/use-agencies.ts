import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { agencyKeys } from './query-keys';
import { AgencyListItem } from '../components/AgencyListTable';

const GET_AGENCIES = `
  query GetAgencies($page: Int, $limit: Int, $query: String) {
    getAgencies(page: $page, limit: $limit, query: $query) {
      agencies {
        _id
        agency_name
        commission_percentage
        contact {
          email
          phoneNumber
        }
        total_amount_paid
        total_balance
        total_referrals
        total_sales_volume
      }
      count
      currentPage
      totalPages
      success
      dashboard {
        total_agencies
        active_agencies
        total_users_under_agencies
        all_agencies_total_sales_volume
        total_commission_paid
      }
    }
  }
`;

export const DEFAULT_AGENCY_LIMIT = 25;

export interface AgenciesFilters {
  page?: number;
  limit?: number;
  searchQuery?: string | null;
}

interface AgenciesResponse {
  getAgencies?: {
    agencies: AgencyListItem[];
    count: number;
    currentPage: number;
    totalPages: number;
    success: boolean;
    dashboard?: {
      total_agencies?: number;
      active_agencies?: number;
      total_users_under_agencies?: number;
      all_agencies_total_sales_volume?: number;
      total_commission_paid?: number;
    };
  };
}

export const useAgencies = (filters: AgenciesFilters) => {
  const {
    page = 1,
    limit = DEFAULT_AGENCY_LIMIT,
    searchQuery,
  } = filters;

  return useQuery({
    queryKey: agencyKeys.list({ page, limit, searchQuery }),
    queryFn: () =>
      executeRaw<AgenciesResponse>(GET_AGENCIES, {
        page,
        limit,
        query: searchQuery || undefined,
      }),
    select: (data) => data.getAgencies,
  });
};

export type AgenciesData = NonNullable<ReturnType<typeof useAgencies>['data']>;
