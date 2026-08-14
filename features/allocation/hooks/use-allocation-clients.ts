import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { allocationKeys } from './query-keys';
import { FiltersInput } from '@/lib/gql/graphql';

const GET_ALLOCATION_CLIENTS_QUERY = graphql(`
  query EligibleClientsForLand($page: Int!, $limit: Int!, $filters: FiltersInput) {
    eligibleClientsForLand(page: $page, limit: $limit, filters: $filters) {
      count
      data {
        ...AllocationTableRowFragment
      }
      limit
      page
    }
  }
`);

export interface AllocationClientFilters {
  page?: number;
  limit?: number;
  assetName?: string | null;
  assetType?: string | null;
  percentage?: number | null;
  search?: string | null;
  allocationStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  [key: string]: unknown;
}

export const DEFAULT_ALLOCATION_LIMIT = 25;

export const useAllocationClients = (filters: AllocationClientFilters) => {
  const {
    page = 1,
    limit = DEFAULT_ALLOCATION_LIMIT,
    assetName,
    assetType,
    percentage,
    search,
    allocationStatus,
    startDate,
    endDate,
  } = filters;

  return useQuery({
    queryKey: allocationKeys.list(filters),
    queryFn: () => {
      const gqlFilters = {
        assetName: assetName || undefined,
        assetType: assetType || undefined,
        percentage: percentage ?? undefined,
        search: search || undefined,
        allocationStatus: allocationStatus || undefined,
        // API supports date range for this endpoint; generated FiltersInput is currently stale.
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      return execute(GET_ALLOCATION_CLIENTS_QUERY, {
        page,
        limit,
        filters: gqlFilters as FiltersInput & { startDate?: string; endDate?: string },
      });
    },
    select: (data) => data.eligibleClientsForLand,
  });
};

export type AllocationClientsData = NonNullable<
  ReturnType<typeof useAllocationClients>['data']
>;
