'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import { companyEventKeys } from './query-keys';

const DEALLOCATE_FROM_EVENT_MUTATION = graphql(`
  mutation DeallocateFromEvent($eventId: ID!, $allocationId: ID!, $reason: String) {
    deallocateFromEvent(eventId: $eventId, allocationId: $allocationId, reason: $reason) {
      deallocated
      already_cancelled
      freed
    }
  }
`);

export interface DeallocateEventClientInput {
  eventId: string;
  eventAllocationId: string;
  /** Optional audit-trail note. */
  reason?: string;
}

/**
 * `deallocateFromEvent` — post-save release for a last-minute drop-out.
 * Frees the reserved size back to the event and re-opens the person's spot
 * in eligible-clients.
 *
 * Idempotent: releasing an already-cancelled allocation returns
 * `{ deallocated: false, already_cancelled: true, freed: 0 }` rather than
 * throwing, so the UI can tell "released 500 sqm" from "already gone".
 */
export const useDeallocateEventClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, eventAllocationId, reason }: DeallocateEventClientInput) =>
      execute(DEALLOCATE_FROM_EVENT_MUTATION, {
        eventId,
        allocationId: eventAllocationId,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
