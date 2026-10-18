'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EventAllocationSchema, type EventAllocation } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export const ALLOCATIONS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface EventAllocationsExportResult {
  rows: EventAllocation[];
  truncated: boolean;
}

/**
 * Loops pages of `GET /admin/company-events/:id/allocations` into one export
 * set — mirrors `use-event-eligible-clients-export.ts`'s page-looping pattern.
 */
export const fetchEventAllocationsExportRows = async (eventId: string): Promise<EventAllocationsExportResult> => {
  const rows: EventAllocation[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < ALLOCATIONS_EXPORT_ROW_CAP) {
    const { items, meta } = await apiGetPaged(`/admin/company-events/${eventId}/allocations`, EventAllocationSchema, {
      params: { page, limit: EXPORT_PAGE_SIZE },
    });
    total = meta.total ?? items.length;
    rows.push(...items);
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
