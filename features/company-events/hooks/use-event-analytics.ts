'use client';

import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import { companyEventKeys } from './query-keys';

const GET_COMPANY_EVENT_ANALYTICS_QUERY = graphql(`
  query GetCompanyEventAnalytics($eventId: ID!) {
    companyEventAnalytics(eventId: $eventId) {
      event
      title
      funnel {
        allocated
        registered
        checked_in
        confirmed
      }
      registration_split {
        registered
        not_registered
      }
      no_show
      cancelled
      category_mix {
        category
        count
      }
      pickup_load {
        id
        name
        seat_limit
        registered
      }
      capacity {
        available_size
        reserved_size
        remaining
        utilization_pct
        size_unit
      }
    }
  }
`);

/**
 * `companyEventAnalytics` — funnel, registration split, no-show count,
 * category mix and pickup-location load off one query. Allocation events
 * only; the resolver rejects a site-inspection id, so callers gate on
 * `event.type === 'allocation'` the same way `useEventEligibleClients` does.
 */
export const useEventAnalytics = (eventId: string | undefined) => {
  return useQuery({
    queryKey: companyEventKeys.metrics(eventId ?? ''),
    queryFn: () => execute(GET_COMPANY_EVENT_ANALYTICS_QUERY, { eventId: eventId as string }),
    enabled: !!eventId,
    select: (data) => data.companyEventAnalytics,
  });
};

export type EventAnalytics = NonNullable<ReturnType<typeof useEventAnalytics>['data']>;
