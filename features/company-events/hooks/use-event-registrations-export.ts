'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EventRegistrationRowSchema, type EventRegistrationRow } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import type { EventRegistrationsListFilters } from './use-event-registrations';

export const REGISTRATIONS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface EventRegistrationsExportResult {
  rows: EventRegistrationRow[];
  truncated: boolean;
}

/**
 * Loops pages of `GET /admin/company-events/:id/registrations` into one
 * export set — mirrors `use-event-eligible-clients-export.ts`'s page-looping
 * pattern.
 */
export const fetchEventRegistrationsExportRows = async (
  eventId: string,
  filters: Omit<EventRegistrationsListFilters, 'page' | 'limit'> = {}
): Promise<EventRegistrationsExportResult> => {
  const rows: EventRegistrationRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < REGISTRATIONS_EXPORT_ROW_CAP) {
    const { items, meta } = await apiGetPaged(
      `/admin/company-events/${eventId}/registrations`,
      EventRegistrationRowSchema,
      {
        params: { page, limit: EXPORT_PAGE_SIZE, category: filters.category, search: filters.search || undefined },
      }
    );
    total = meta.total ?? items.length;
    rows.push(...items);
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
