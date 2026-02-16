import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { upgradeKeys } from './query-keys';

const GET_UPGRADE_REQUESTS = graphql(`
  query GetAllUpgradeRequests($page: Int!, $limit: Int!, $adminStatus: AdminStatus) {
    getAllUpgradeRequests(page: $page, limit: $limit, adminStatus: $adminStatus) {
      upgradeRequests {
        ...UpgradeRowFragment
      }
      pagination {
        currentPage
        limit
        totalCount
        totalPages
      }
    }
  }
`);

export interface UpgradeRequestsFilters {
  page?: number;
  limit?: number;
  adminStatus?: string | null;
  search?: string | null;
}

export const DEFAULT_UPGRADE_LIMIT = 25;

export const useUpgradeRequests = (filters: UpgradeRequestsFilters) => {
  const {
    page = 1,
    limit = DEFAULT_UPGRADE_LIMIT,
    adminStatus,
  } = filters;

  return useQuery({
    queryKey: upgradeKeys.list(filters as any),
    queryFn: () =>
      execute(GET_UPGRADE_REQUESTS, {
        page,
        limit,
        adminStatus: (adminStatus || undefined) as any,
      }),
    select: (data) => data.getAllUpgradeRequests,
  });
};

export type UpgradeRequestsData = NonNullable<
  ReturnType<typeof useUpgradeRequests>['data']
>;
