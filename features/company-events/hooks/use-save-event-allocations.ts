'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { SaveEventAllocationsResultSchema } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface SaveEventAllocationsInput {
  eventId: string;
  paymentPlanIds: string[];
}

/**
 * `POST /admin/company-events/:id/allocations` — saves the selected batch.
 * The response is a partial-success shape (decision #1: the server
 * re-validates every id regardless of what the admin's screen showed, so
 * some ids in the request can still come back `failed`).
 */
export const useSaveEventAllocations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, paymentPlanIds }: SaveEventAllocationsInput) =>
      apiPost(
        `/admin/company-events/${eventId}/allocations`,
        { payment_plan_ids: paymentPlanIds },
        SaveEventAllocationsResultSchema
      ),
    onSuccess: () => {
      // Invalidate the whole domain rather than a narrower list key: a list
      // key embeds the active filters object, and invalidateQueries only
      // partial-matches up to the given key's length, so a filters-less key
      // here wouldn't match a query cached with real filters (mirrors the
      // same choice in features/allocation/hooks/use-allocate-land.ts).
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
