import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { upgradeKeys } from './query-keys';
import { AdminStatus } from '@/lib/gql/graphql';

const GET_UPGRADE_REQUESTS = graphql(`
  query GetAllUpgradeRequests(
    $page: Int!
    $limit: Int!
    $adminStatus: AdminStatus
    $upgradeType: String
    $startDate: String
    $endDate: String
    $search: String
  ) {
    getAllUpgradeRequests(
      page: $page
      limit: $limit
      adminStatus: $adminStatus
      upgradeType: $upgradeType
      startDate: $startDate
      endDate: $endDate
      search: $search
    ) {
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
  /** BE addition: filter by upgrade type (e.g. "associate" | "associate-pro"). */
  upgradeType?: string | null;
  /** BE addition: ISO/period start of the createdAt window. */
  startDate?: string | null;
  /** BE addition: ISO/period end of the createdAt window. */
  endDate?: string | null;
  search?: string | null;
}

export const DEFAULT_UPGRADE_LIMIT = 25;

export const useUpgradeRequests = (filters: UpgradeRequestsFilters) => {
  const {
    page = 1,
    limit = DEFAULT_UPGRADE_LIMIT,
    adminStatus,
    upgradeType = null,
    startDate = null,
    endDate = null,
  } = filters;
  const search = filters.search ?? null;
  const keyFilters: Record<string, unknown> = {
    page,
    limit,
    adminStatus: adminStatus ?? null,
    upgradeType,
    startDate,
    endDate,
    search,
  };

  return useQuery({
    queryKey: upgradeKeys.list(keyFilters),
    queryFn: () =>
      execute(GET_UPGRADE_REQUESTS, {
        page,
        limit,
        adminStatus: (adminStatus || undefined) as AdminStatus | undefined,
        upgradeType,
        startDate,
        endDate,
        search,
      }),
    select: (data) => data.getAllUpgradeRequests,
  });
};

export type UpgradeRequestsData = NonNullable<
  ReturnType<typeof useUpgradeRequests>['data']
>;
