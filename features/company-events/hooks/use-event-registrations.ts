"use client";

import { useQuery } from "@tanstack/react-query";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { execute } from "@/lib/graphql-client";

import type {
  EventAllocationStatus,
  EventAttendeeType,
  RegistrationCategory,
} from "../schemas/company-event.schema";
import { companyEventKeys } from "./query-keys";

// NOTE: excluded from codegen (see codegen.ts) — these fields are on the
// allocation-events backend branch and not yet on the schema codegen
// introspects. Parsed manually, the same way use-allocate-land.ts does it;
// `graphql()` would return `{}` for an unregistered document and crash at
// execute. Move back to graphql() once the BE lands on staging.
export const GET_EVENT_REGISTRATIONS_QUERY = parse(`
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
        attendee_type
        getting_land
        name
        phone
        email
        category
        status
        pickup_location
        invite_sent_at
        registered_at
        checked_in_at
        confirmed_at
        submitted_at
      }
    }
  }
`) as unknown as TypedDocumentNode<
  { eventRegistrations: { count: number; data: RawEventRegistrationRow[] } },
  {
    eventId: string;
    page: number;
    limit: number;
    filter?: {
      category?: string;
      search?: string;
      attendee_type?: string;
      status?: string;
    };
  }
>;

/**
 * As it comes off the wire.
 *
 * Name, phone, email and category are nullable, and that is not defensiveness
 * — a row is created the moment somebody is allocated, which is before the
 * invite is sent and long before they fill anything in. An invited attendee who
 * has not replied genuinely has none of these yet.
 */
interface RawEventRegistrationRow {
  id: string;
  allocation: string | null;
  attendee_type: string;
  getting_land: boolean;
  name: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  status: string;
  pickup_location: string | null;
  invite_sent_at: string | null;
  registered_at: string | null;
  checked_in_at: string | null;
  confirmed_at: string | null;
  submitted_at: string | null;
}

export interface EventRegistrationsListFilters {
  page?: number;
  limit?: number;
  category?: RegistrationCategory | null;
  search?: string | null;
  /** allocated | visitor — the two populations, filtered apart. */
  attendeeType?: EventAttendeeType | null;
  status?: EventAllocationStatus | null;
}

export interface EventRegistrationsFilters extends EventRegistrationsListFilters {
  [key: string]: unknown;
}

export const DEFAULT_EVENT_REGISTRATIONS_LIMIT = 50;

/** See `narrowAllocationRow` — same reasoning, and the same string-typed schema. */
export const narrowRegistrationRow = (row: RawEventRegistrationRow) => ({
  ...row,
  attendee_type: row.attendee_type as EventAttendeeType,
  category: (row.category ?? null) as RegistrationCategory | null,
  status: row.status as EventAllocationStatus,
});

/**
 * `eventRegistrations` — everyone coming to the event, of both kinds.
 *
 * Not only form submissions any more. Since attendance moved onto its own
 * record, this is the full guest list: people we allocated land to (whether or
 * not they have replied yet) and people who signed themselves up through the
 * public link. `attendee_type` is what tells them apart, and it is derived from
 * whether an allocation is attached rather than stored, so it cannot disagree
 * with the land.
 */
export const useEventRegistrations = (
  eventId: string | undefined,
  filters: EventRegistrationsFilters = {}
) => {
  const {
    page = 1,
    limit = DEFAULT_EVENT_REGISTRATIONS_LIMIT,
    category,
    search,
    attendeeType,
    status,
  } = filters;

  return useQuery({
    queryKey: companyEventKeys.registrations(eventId ?? "", filters),
    queryFn: () =>
      execute(GET_EVENT_REGISTRATIONS_QUERY, {
        eventId: eventId as string,
        page,
        limit,
        filter: {
          category: category || undefined,
          search: search || undefined,
          attendee_type: attendeeType || undefined,
          status: status || undefined,
        },
      }),
    enabled: !!eventId,
    select: (data) => ({
      count: data.eventRegistrations.count,
      items: data.eventRegistrations.data.map(narrowRegistrationRow),
    }),
  });
};

export type EventRegistrationRow = ReturnType<typeof narrowRegistrationRow>;
