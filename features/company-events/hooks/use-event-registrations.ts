'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EventRegistrationRowSchema, type EventAllocationStatus, type RegistrationCategory } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface EventRegistrationsListFilters {
  page?: number;
  limit?: number;
  category?: RegistrationCategory;
  status?: EventAllocationStatus;
  attendanceType?: "visitor" | "getting_land";
  pickupLocationId?: string;
  search?: string;
  [key: string]: unknown;
}

export const DEFAULT_EVENT_REGISTRATIONS_LIMIT = 25;

/**
 * `GET /admin/company-events/:id/registrations` — real as of PR #69. Paginated
 * table of this event's public form submissions, newest first — independent
 * of the "Allocated" table's lifecycle status (`event-registration.controller.ts`
 * writes these directly, no admin join needed).
 */
export const useEventRegistrations = (
  eventId: string | undefined,
  filters: EventRegistrationsListFilters = {}
) => {
  const { page = 1, limit = DEFAULT_EVENT_REGISTRATIONS_LIMIT, category, status, attendanceType, pickupLocationId, search } = filters;

  return useQuery({
    queryKey: companyEventKeys.registrations(eventId ?? '', filters),
    queryFn: () =>
      apiGetPaged(`/admin/company-events/${eventId}/registrations`, EventRegistrationRowSchema, {
        params: { page, limit, category, status, attendance_type: attendanceType, pickup_location_id: pickupLocationId, search: search || undefined },
      }),
    enabled: !!eventId,
  });
};
