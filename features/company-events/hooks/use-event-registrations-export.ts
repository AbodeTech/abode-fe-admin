'use client';

import { useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';

import { companyEventKeys } from './query-keys';
import {
  GET_EVENT_REGISTRATIONS_QUERY,
  narrowRegistrationRow,
  type EventRegistrationsListFilters,
  type EventRegistrationRow,
} from './use-event-registrations';

export const REGISTRATIONS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface EventRegistrationsExportResult {
  rows: EventRegistrationRow[];
  truncated: boolean;
}

/** Loops pages of `eventRegistrations` into one export set. */
export const fetchEventRegistrationsExportRows = async (
  eventId: string,
  filters?: Omit<EventRegistrationsListFilters, 'page' | 'limit'>
): Promise<EventRegistrationsExportResult> => {
  const rows: EventRegistrationRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < REGISTRATIONS_EXPORT_ROW_CAP) {
    const result = await execute(GET_EVENT_REGISTRATIONS_QUERY, {
      eventId,
      page,
      limit: EXPORT_PAGE_SIZE,
      filter: {
        category: filters?.category || undefined,
        search: filters?.search || undefined,
        attendee_type: filters?.attendeeType || undefined,
        status: filters?.status || undefined,
      },
    });
    const items = result.eventRegistrations.data;
    total = result.eventRegistrations.count ?? items.length;
    rows.push(...items.map(narrowRegistrationRow));
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return { rows, truncated: rows.length < total };
};

export const useEventRegistrationsExport = () => {
  return useMutation({
    mutationKey: companyEventKeys.export('registrations'),
    mutationFn: ({
      eventId,
      filters,
    }: {
      eventId: string;
      filters?: Omit<EventRegistrationsListFilters, 'page' | 'limit'>;
    }) => fetchEventRegistrationsExportRows(eventId, filters),
  });
};
