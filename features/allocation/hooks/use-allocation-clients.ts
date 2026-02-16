import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { allocationKeys } from './query-keys';

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
  } = filters;

  return useQuery({
    queryKey: allocationKeys.list(filters),
    queryFn: () =>
      execute(GET_ALLOCATION_CLIENTS_QUERY, {
        page,
        limit,
        filters: {
          assetName: assetName || undefined,
          assetType: assetType || undefined,
          percentage: percentage ?? undefined,
          search: search || undefined,
        },
      }),
    select: (data) => data.eligibleClientsForLand,
  });
};

export type AllocationClientsData = NonNullable<
  ReturnType<typeof useAllocationClients>['data']
>;
