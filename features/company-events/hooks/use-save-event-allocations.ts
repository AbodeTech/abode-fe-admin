'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import { companyEventKeys } from './query-keys';

const ALLOCATE_TO_EVENT_MUTATION = graphql(`
  mutation AllocateToEvent($eventId: ID!, $paymentPlanIds: [ID!]!) {
    allocateToEvent(eventId: $eventId, paymentPlanIds: $paymentPlanIds) {
      remaining_capacity
      succeeded {
        payment_plans
        id
        size_reserved
      }
      failed {
        payment_plan
        reason
      }
    }
  }
`);

export interface SaveEventAllocationsInput {
  eventId: string;
  paymentPlanIds: string[];
}

/**
 * `allocateToEvent` — commits the selected batch.
 *
 * One entry in `succeeded` is one seat, and a seat can cover several of the
 * ids sent — a buyer holding three plots here is allocated once, for their
 * combined size. So `succeeded.length` counts people, not plans, and will be
 * smaller than the number of ids submitted whenever someone holds more than
 * one plot.
 *
 * Deliberately not all-or-nothing at the row level: the server re-validates
 * every id regardless of what the admin's screen showed, so plans can come
 * back in `failed` with a reason while the rest still go through. One client
 * suspended since the page loaded does not cost the whole batch — callers
 * must report both lists rather than assuming success.
 */
export const useSaveEventAllocations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, paymentPlanIds }: SaveEventAllocationsInput) =>
      execute(ALLOCATE_TO_EVENT_MUTATION, { eventId, paymentPlanIds }),
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

export type SaveEventAllocationsResult = Awaited<
  ReturnType<ReturnType<typeof useSaveEventAllocations>['mutateAsync']>
>['allocateToEvent'];
