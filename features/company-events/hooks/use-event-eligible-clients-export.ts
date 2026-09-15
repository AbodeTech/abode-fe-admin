'use client';

import { useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';

import { companyEventKeys } from './query-keys';
import {
  GET_EVENT_ELIGIBLE_CLIENTS_QUERY,
  narrowEligibleClientRow,
  type EventEligibleClientListFilters,
  type EventEligibleClientRow,
} from './use-event-eligible-clients';

export const ELIGIBLE_CLIENTS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface EventEligibleClientsExportResult {
  rows: EventEligibleClientRow[];
  truncated: boolean;
}

/** Loops pages of `eventEligibleClients` into one export set. */
export const fetchEventEligibleClientsExportRows = async (
  eventId: string,
  filters: Omit<EventEligibleClientListFilters, 'page' | 'limit'>
): Promise<EventEligibleClientsExportResult> => {
  const rows: EventEligibleClientRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < ELIGIBLE_CLIENTS_EXPORT_ROW_CAP) {
    const result = await execute(GET_EVENT_ELIGIBLE_CLIENTS_QUERY, {
      eventId,
      page,
      limit: EXPORT_PAGE_SIZE,
      filter: {
        search: filters.search || undefined,
        eligibility_tier: filters.eligibilityTier || undefined,
      },
    });
    const items = result.eventEligibleClients.data;
    total = result.eventEligibleClients.count ?? items.length;
    rows.push(...items.map(narrowEligibleClientRow));
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
      filters: Omit<EventEligibleClientListFilters, 'page' | 'limit'>;
    }) => fetchEventEligibleClientsExportRows(eventId, filters),
  });
};
