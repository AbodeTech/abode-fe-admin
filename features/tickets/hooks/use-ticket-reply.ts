'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { TicketDetailSchema } from '../schemas/ticket.schema';
import { ticketKeys } from './query-keys';

export interface ReplyToTicketInput {
  ticketId: string;
  body: string;
}

/**
 * Answer the customer, from inside the app.
 *
 * The BE attempts the send before recording anything, but writes the message
 * either way — a failed delivery has to be visible in the conversation rather
 * than swallowed. It then throws, so the agent finds out now instead of from
 * the customer a week later. Returns the refreshed detail, so the thread
 * updates without a second round trip.
 */
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, body }: ReplyToTicketInput) =>
      apiPost(`/admin/tickets/${ticketId}/reply`, { body }, TicketDetailSchema),
    onSuccess: (detail, v) => {
      queryClient.setQueryData(ticketKeys.detail(v.ticketId), detail);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};
