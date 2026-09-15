'use client';

import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import type {
  EligibilityQualifiedBy,
  EligibilityTier,
} from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export const GET_EVENT_ELIGIBLE_CLIENTS_QUERY = graphql(`
  query GetEventEligibleClients(
    $eventId: ID!
    $filter: EventEligibleClientFilterInput
    $page: Int!
    $limit: Int!
  ) {
    eventEligibleClients(eventId: $eventId, filter: $filter, page: $page, limit: $limit) {
      count
      data {
        payment_plan
        user
        name
        email
        phone
        size
        no_of_units
        total_size
        eligibility_tier
        land_completed_at
        asset
        asset_type
        qualified_by
        percent_paid
        allocation_qualification
      }
    }
  }
`);

export interface EventEligibleClientListFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  eligibilityTier?: EligibilityTier | null;
}

export interface EventEligibleClientFilters extends EventEligibleClientListFilters {
  [key: string]: unknown;
}

export const DEFAULT_EVENT_ELIGIBLE_LIMIT = 25;

/** See `narrowAllocationRow` — same reasoning for the tier. */
export const narrowEligibleClientRow = <
  T extends { eligibility_tier: string; qualified_by: string },
>(
  row: T
) => ({
  ...row,
  eligibility_tier: row.eligibility_tier as EligibilityTier,
  qualified_by: row.qualified_by as EligibilityQualifiedBy,
});

/**
 * `eventEligibleClients` — the FCFS pool for an allocation event, already
 * excluding anyone holding a standing allocation at this event's asset.
 * Allocation events only; the resolver rejects a site-inspection id, so
 * callers gate on `event.type === 'allocation'`.
 *
 * There are two routes onto this list, which `qualified_by` names. Paying the
 * land off in full qualifies any product, and is the only route full-ownership
 * has. A flex plan also qualifies once it passes the percentage its tier sets
 * as `allocation_qualification` — flex is sold on the understanding that
 * allocation comes at a threshold rather than at the end. So `land_completed_at`
 * is legitimately null for a flex buyer who came in on the threshold, and a
 * plan matching no tier falls back to needing full payment.
 */
export const useEventEligibleClients = (
  eventId: string | undefined,
  filters: EventEligibleClientFilters = {}
) => {
  const { page = 1, limit = DEFAULT_EVENT_ELIGIBLE_LIMIT, search, eligibilityTier } = filters;

  return useQuery({
    queryKey: companyEventKeys.eligibleClients(eventId ?? '', filters),
    queryFn: () =>
      execute(GET_EVENT_ELIGIBLE_CLIENTS_QUERY, {
        eventId: eventId as string,
        page,
        limit,
        filter: {
          search: search || undefined,
          eligibility_tier: eligibilityTier || undefined,
        },
      }),
    enabled: !!eventId,
    select: (data) => ({
      count: data.eventEligibleClients.count,
      items: data.eventEligibleClients.data.map(narrowEligibleClientRow),
    }),
  });
};

export type EventEligibleClientRow =
  NonNullable<ReturnType<typeof useEventEligibleClients>['data']>['items'][number];
