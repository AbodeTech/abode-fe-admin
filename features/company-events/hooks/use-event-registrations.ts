'use client';

import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import type { RegistrationCategory } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export const GET_EVENT_REGISTRATIONS_QUERY = graphql(`
  query GetEventRegistrations(
    $eventId: ID!
    $filter: EventRegistrationFilterInput
    $page: Int!
    $limit: Int!
  ) {
    eventRegistrations(eventId: $eventId, filter: $filter, page: $page, limit: $limit) {
      count
      data {
        id
        allocation
        name
        phone
        email
        category
        pickup_location
        submitted_at
      }
    }
  }
`);

export interface EventRegistrationsListFilters {
  page?: number;
  limit?: number;
  category?: RegistrationCategory | null;
  search?: string | null;
}

export interface EventRegistrationsFilters extends EventRegistrationsListFilters {
  [key: string]: unknown;
}

export const DEFAULT_EVENT_REGISTRATIONS_LIMIT = 50;

/** See `narrowAllocationRow` — same reasoning for the category. */
export const narrowRegistrationRow = <T extends { category: string }>(row: T) => ({
  ...row,
  category: row.category as RegistrationCategory,
});

/** `eventRegistrations` — public form submissions for the event. */
export const useEventRegistrations = (
  eventId: string | undefined,
  filters: EventRegistrationsFilters = {}
) => {
  const { page = 1, limit = DEFAULT_EVENT_REGISTRATIONS_LIMIT, category, search } = filters;

  return useQuery({
    queryKey: companyEventKeys.registrations(eventId ?? '', filters),
    queryFn: () =>
      execute(GET_EVENT_REGISTRATIONS_QUERY, {
        eventId: eventId as string,
        page,
        limit,
        filter: { category: category || undefined, search: search || undefined },
      }),
    enabled: !!eventId,
    select: (data) => ({
      count: data.eventRegistrations.count,
      items: data.eventRegistrations.data.map(narrowRegistrationRow),
    }),
  });
};

export type EventRegistrationRow =
  NonNullable<ReturnType<typeof useEventRegistrations>['data']>['items'][number];
