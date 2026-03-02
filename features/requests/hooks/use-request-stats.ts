import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { requestKeys } from './query-keys';
const GET_REQUEST_STATS = graphql(`
  query GetRequestStatistics($from: Date, $to: Date) {
    getRequestStatistics(dateRange: { from: $from, to: $to }) {
      totalRequests
      pendingRequests
      approvedRequests
      declinedRequests
      locationChangeRequests
      documentChangeRequests
      assetUpdateRequests
      customRequests
      totalFeesCollected
      paidRequests
      unpaidRequests
    }
  }
`);

export interface RequestStatsFilters {
  startDate?: string | null;
  endDate?: string | null;
}

export const useRequestStats = (filters?: RequestStatsFilters) => {
  return useQuery({
    queryKey: requestKeys.stats(filters),
    queryFn: () =>
      execute(GET_REQUEST_STATS, {
        from: filters?.startDate || undefined,
        to: filters?.endDate || undefined,
      }),
    select: (data) => data.getRequestStatistics,
  });
};
