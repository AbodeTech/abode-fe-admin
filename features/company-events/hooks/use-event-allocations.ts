'use client';

import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import type {
  EligibilityTier,
  EventAllocationStatus,
  InviteEmailStatus,
  RegistrationCategory,
} from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export const GET_EVENT_ALLOCATIONS_QUERY = graphql(`
  query GetEventAllocations(
    $eventId: ID!
    $filter: EventAllocationFilterInput
    $page: Int!
    $limit: Int!
  ) {
    eventAllocations(eventId: $eventId, filter: $filter, page: $page, limit: $limit) {
      count
      data {
        id
        user
        payment_plans
        name
        email
        phone
        category
        pickup_location
        status
        eligibility_tier
        size_reserved
        email_status
        invite_sent_at
        registered_at
        checked_in_at
        confirmed_at
        cancelled_at
        createdAt
      }
    }
  }
`);

export interface EventAllocationsListFilters {
  page?: number;
  limit?: number;
  status?: EventAllocationStatus;
  search?: string;
  [key: string]: unknown;
}

export const DEFAULT_EVENT_ALLOCATIONS_LIMIT = 50;

/**
 * The schema types status, tier, email status and category as String!, but
 * the server only ever emits the documented set. Narrowed once here — and
 * reused by the export loop — rather than cast at every badge map in the UI.
 */
export const narrowAllocationRow = <
  T extends {
    status: string;
    eligibility_tier: string;
    email_status: string;
    category?: string | null;
  },
>(
  row: T
) => ({
  ...row,
  status: row.status as EventAllocationStatus,
  eligibility_tier: row.eligibility_tier as EligibilityTier,
  email_status: row.email_status as InviteEmailStatus,
  category: (row.category ?? null) as RegistrationCategory | null,
});

/**
 * `eventAllocations` — the roster of everyone committed to the event.
 *
 * A row is one person's seat, not one plot: `payment_plans` lists every plot
 * it covers (more than one where the buyer holds several at the event's
 * estates) and `size_reserved` is their total.
 * Contact comes from the person's registration form where they submitted
 * one, else their user record. Cancelled rows are included: a released seat
 * is part of the event's history the admin reviews.
 */
export const useEventAllocations = (
  eventId: string | undefined,
  filters: EventAllocationsListFilters = {}
) => {
  const { page = 1, limit = DEFAULT_EVENT_ALLOCATIONS_LIMIT, status, search } = filters;

  return useQuery({
    queryKey: companyEventKeys.allocations(eventId ?? '', filters),
    queryFn: () =>
      execute(GET_EVENT_ALLOCATIONS_QUERY, {
        eventId: eventId as string,
        page,
        limit,
        filter: { status: status || undefined, search: search || undefined },
      }),
    enabled: !!eventId,
    select: (data) => ({
      count: data.eventAllocations.count,
      items: data.eventAllocations.data.map(narrowAllocationRow),
    }),
  });
};

export type EventAllocationRow =
  NonNullable<ReturnType<typeof useEventAllocations>['data']>['items'][number];
