'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EventEligibleClientSchema, type EventEligibleClient } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import type { EventEligibleClientFilters } from './use-event-eligible-clients';

/**
 * Loops pages of `GET /admin/company-events/:id/eligible-clients` into one
 * export set — mirrors `features/sales/hooks/use-sales-export.ts`'s
 * page-looping pattern (the BE caps a single page, so an export set means
 * looping rather than requesting one huge page).
 */
export const ELIGIBLE_CLIENTS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface EventEligibleClientsExportResult {
  rows: EventEligibleClient[];
  truncated: boolean;
}

export const fetchEventEligibleClientsExportRows = async (
  eventId: string,
  filters: Omit<EventEligibleClientFilters, 'page' | 'limit'>
): Promise<EventEligibleClientsExportResult> => {
  const rows: EventEligibleClient[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < ELIGIBLE_CLIENTS_EXPORT_ROW_CAP) {
    const { items, meta } = await apiGetPaged(
      `/admin/company-events/${eventId}/eligible-clients`,
      EventEligibleClientSchema,
      {
        params: {
          page,
          limit: EXPORT_PAGE_SIZE,
          search: filters.search || undefined,
          eligibility_tier: filters.eligibilityTier || undefined,
        },
      }
    );
    total = meta.total ?? items.length;
    rows.push(...items);
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return { rows, truncated: rows.length < total };
};

export const useEventEligibleClientsExport = () => {
  return useMutation({
    mutationKey: companyEventKeys.export('eligible-clients'),
    mutationFn: ({
      eventId,
      filters,
    }: {
      eventId: string;
      filters: Omit<EventEligibleClientFilters, 'page' | 'limit'>;
    }) => fetchEventEligibleClientsExportRows(eventId, filters),
  });
};
