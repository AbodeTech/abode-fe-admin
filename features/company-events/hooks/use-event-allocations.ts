'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EventAllocationSchema, type EventAllocationStatus } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface EventAllocationsListFilters {
  page?: number;
  limit?: number;
  status?: EventAllocationStatus;
  search?: string;
  /** Removed people are left out unless asked for (the "Show removed" toggle). */
  include_removed?: boolean;
  [key: string]: unknown;
}

export const DEFAULT_EVENT_ALLOCATIONS_LIMIT = 50;

/**
 * `GET /admin/company-events/:id/allocations` — real as of PR #69
 * (abode-be-v2 staging, "company-events-offline"). Paginated roster of
 * everyone committed to the event, newest first; contact is resolved from
 * the person's registration form where they've submitted one, else their
 * user record. Removed people are left out unless `include_removed` is set.
 */
export const useEventAllocations = (eventId: string | undefined, filters: EventAllocationsListFilters = {}) => {
  const { page = 1, limit = DEFAULT_EVENT_ALLOCATIONS_LIMIT, status, search, include_removed } = filters;

  return useQuery({
    queryKey: companyEventKeys.allocations(eventId ?? '', filters),
    queryFn: () =>
      apiGetPaged(`/admin/company-events/${eventId}/allocations`, EventAllocationSchema, {
        params: { page, limit, status, search: search || undefined, include_removed: include_removed || undefined },
      }),
    enabled: !!eventId,
  });
};
