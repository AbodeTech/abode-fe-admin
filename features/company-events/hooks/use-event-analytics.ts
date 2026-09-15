'use client';

import { useQuery } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';

import { companyEventKeys } from './query-keys';

// NOTE: excluded from codegen (see codegen.ts) until the allocation-events
// backend lands on staging. See the note in use-event-registrations.ts.
const GET_COMPANY_EVENT_ANALYTICS_QUERY = parse(`
  query GetCompanyEventAnalytics($eventId: ID!) {
    companyEventAnalytics(eventId: $eventId) {
      event
      title
      funnel {
        attending
        allocated
        registrants
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
`) as unknown as TypedDocumentNode<
  { companyEventAnalytics: RawEventAnalytics },
  { eventId: string }
>;

interface RawEventAnalytics {
  event: string;
  title: string;
  funnel: {
    /** Everyone expected — allocated and visitors together. The bus number. */
    attending: number;
    /** Of those, how many are being given land. */
    allocated: number;
    /** And how many signed themselves up with no allocation. */
    registrants: number;
    registered: number;
    checked_in: number;
    confirmed: number;
  };
  registration_split: { registered: number; not_registered: number };
  no_show: number;
  cancelled: number;
  category_mix: { category: string; count: number }[];
  pickup_load: { id: string; name: string; seat_limit: number | null; registered: number }[];
  capacity: {
    available_size: number | null;
    reserved_size: number;
    remaining: number | null;
    utilization_pct: number | null;
    size_unit: string;
  };
}

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
