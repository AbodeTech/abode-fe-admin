'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete } from '@/lib/api-client';

import { DeallocateResultSchema } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface DeallocateEventClientInput {
  eventId: string;
  eventAllocationId: string;
  /** Optional audit-trail note — `DeallocateDto.reason` is not required on the real backend. */
  reason?: string;
}

/**
 * `DELETE /admin/company-events/:id/allocations/:allocationId` — post-save
 * de-allocation (decision #5: last-minute drop-out, frees the reserved size
 * back to the pool and re-opens the person's spot in eligible-clients).
 * Idempotent on the real backend — an already-cancelled allocation comes
 * back `{ deallocated: false, already_cancelled: true, freed: 0 }` rather
 * than an error.
 */
export const useDeallocateEventClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, eventAllocationId, reason }: DeallocateEventClientInput) =>
      apiDelete(
        `/admin/company-events/${eventId}/allocations/${eventAllocationId}`,
        DeallocateResultSchema,
        { body: reason ? { reason } : undefined }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
