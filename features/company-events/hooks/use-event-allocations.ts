'use client';

import { useQuery } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';

import type {
  EligibilityTier,
  EventAllocationStatus,
  InviteEmailStatus,
  LandAllocationStatus,
  RegistrationCategory,
} from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

// NOTE: excluded from codegen (see codegen.ts) until the allocation-events
// backend lands on staging. See the note in use-event-registrations.ts.
export const GET_EVENT_ALLOCATIONS_QUERY = parse(`
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
        allocation_status
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
`) as unknown as TypedDocumentNode<
  { eventAllocations: { count: number; data: RawEventAllocationRow[] } },
  {
    eventId: string;
    page: number;
    limit: number;
    filter?: { status?: string; search?: string };
  }
>;

interface RawEventAllocationRow {
  id: string;
  user: string | null;
  payment_plans: string[];
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  pickup_location: string | null;
  /** Attendance: invited, registered, boarded, confirmed. */
  status: string;
  /** The land: allocated or cancelled. A different question from `status`. */
  allocation_status: string;
  eligibility_tier: string;
  size_reserved: number;
  email_status: string;
  invite_sent_at: string | null;
  registered_at: string | null;
  checked_in_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  createdAt: string | null;
}

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
    allocation_status?: string;
    eligibility_tier: string;
    email_status: string;
    category?: string | null;
  },
>(
  row: T
) => ({
  ...row,
  status: row.status as EventAllocationStatus,
  allocation_status: (row.allocation_status ?? 'allocated') as LandAllocationStatus,
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
