'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';

import { CompanyEventSchema, type CompanyEventStatus } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface UpdateEventStatusInput {
  eventId: string;
  status: CompanyEventStatus;
}

/**
 * `PATCH /admin/company-events/:id/status` — real as of PR #70 (staging
 * `ba31456`). Same endpoint the `/publish` and `/close` shortcuts call under
 * the hood (`transitionStatus()`), so this one mutation covers every move.
 * The server enforces the legal transition graph and throws
 * `INVALID_STATUS_TRANSITION` (400) for an illegal one — the error message
 * is surfaced as-is rather than re-validated client-side.
 */
export const useUpdateEventStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: UpdateEventStatusInput) =>
      apiPatch(`/admin/company-events/${eventId}/status`, { status }, CompanyEventSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
