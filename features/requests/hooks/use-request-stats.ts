import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { requestKeys } from './query-keys';
import { RequestStatsFragment } from '../components/RequestStats';
import { RequestTypeCardFragment } from '../components/RequestTypeCards';

const GET_REQUEST_STATS = graphql(`
  query GetRequestStatistics($startDate: String, $endDate: String) {
    getRequestStatistics(dateRange: { startDate: $startDate, endDate: $endDate }) {
      ...RequestStats_stats
      ...RequestTypeCards_stats
    }
  }
`);

export interface RequestStatsFilters {
  startDate?: string | null;
  endDate?: string | null;
}

export const useRequestStats = (filters?: RequestStatsFilters) => {
  return useQuery({
    queryKey: requestKeys.stats(filters as any),
    queryFn: () =>
      execute(GET_REQUEST_STATS as any, {
        startDate: filters?.startDate || undefined,
        endDate: filters?.endDate || undefined,
      }),
    select: (data) => (data as any).getRequestStatistics,
  });
};
