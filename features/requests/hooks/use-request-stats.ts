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
  const keyRange: Record<string, unknown> | undefined = filters
    ? {
        startDate: filters.startDate ?? undefined,
        endDate: filters.endDate ?? undefined,
      }
    : undefined;

  return useQuery({
    queryKey: requestKeys.stats(keyRange),
    queryFn: () =>
      execute(GET_REQUEST_STATS, {
        from: filters?.startDate || undefined,
        to: filters?.endDate || undefined,
      }),
    select: (data) => data.getRequestStatistics,
  });
};
