'use client';

import { useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';

import { companyEventKeys } from './query-keys';
import {
  GET_EVENT_ALLOCATIONS_QUERY,
  narrowAllocationRow,
  type EventAllocationRow,
} from './use-event-allocations';

export const ALLOCATIONS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface EventAllocationsExportResult {
  rows: EventAllocationRow[];
  truncated: boolean;
}

/**
 * Loops pages of `eventAllocations` into one export set. The server caps a
 * single page, so an export means looping rather than asking for one huge
 * page — same shape as the eligible-clients export below it.
 */
export const fetchEventAllocationsExportRows = async (
  eventId: string
): Promise<EventAllocationsExportResult> => {
  const rows: EventAllocationRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < ALLOCATIONS_EXPORT_ROW_CAP) {
    const result = await execute(GET_EVENT_ALLOCATIONS_QUERY, {
      eventId,
      page,
      limit: EXPORT_PAGE_SIZE,
      filter: {},
    });
    const items = result.eventAllocations.data;
    total = result.eventAllocations.count ?? items.length;
    rows.push(...items.map(narrowAllocationRow));
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return { rows, truncated: rows.length < total };
};

export const useEventAllocationsExport = () => {
  return useMutation({
    mutationKey: companyEventKeys.export('allocations'),
    mutationFn: (eventId: string) => fetchEventAllocationsExportRows(eventId),
  });
};
