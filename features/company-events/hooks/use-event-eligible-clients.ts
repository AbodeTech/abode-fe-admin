'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EventEligibleClientSchema, type EligibilityTier } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface EventEligibleClientFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  eligibilityTier?: EligibilityTier | null;
  [key: string]: unknown;
}

export const DEFAULT_EVENT_ELIGIBLE_LIMIT = 25;

/**
 * `GET /admin/company-events/:id/eligible-clients` — FCFS-ordered pool for
 * an allocation event, already excluding anyone with a standing allocation
 * at this event's asset (this event or a past round — decision #15).
 */
export const useEventEligibleClients = (eventId: string | undefined, filters: EventEligibleClientFilters = {}) => {
  const { page = 1, limit = DEFAULT_EVENT_ELIGIBLE_LIMIT, search, eligibilityTier } = filters;

  return useQuery({
    queryKey: companyEventKeys.eligibleClients(eventId ?? '', filters),
    queryFn: () =>
      apiGetPaged(`/admin/company-events/${eventId}/eligible-clients`, EventEligibleClientSchema, {
        params: {
          page,
          limit,
          search: search || undefined,
          eligibility_tier: eligibilityTier || undefined,
        },
      }),
    enabled: !!eventId,
  });
};
