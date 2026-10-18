'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { EventAnalyticsSchema } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

/**
 * `GET /admin/company-events/:id/analytics` — real as of PR #69. Replaces
 * the old mock-only `/metrics` call: the funnel, registration split,
 * no-show count, category mix, and pickup-location load all come off this
 * one endpoint now. Only fires for allocation-type events (the real backend
 * throws `NOT_AN_ALLOCATION_EVENT` for a site-inspection id) — callers gate
 * on `event.type === 'allocation'` the same way `useEventEligibleClients` does.
 */
export const useEventAnalytics = (eventId: string | undefined) => {
  return useQuery({
    queryKey: companyEventKeys.metrics(eventId ?? ''),
    queryFn: () => apiGet(`/admin/company-events/${eventId}/analytics`, EventAnalyticsSchema),
    enabled: !!eventId,
  });
};
