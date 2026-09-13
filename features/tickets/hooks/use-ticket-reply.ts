"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { ticketKeys } from "./query-keys";

/**
 * Send an email reply to the customer.
 *
 * The BE stamps the thread headers, the plus-addressed reply-to and the subject
 * tag on the way out, which is the whole mechanism by which the customer's
 * answer finds its way back to this ticket. Nothing here needs to know about
 * that beyond not dropping the call.
 *
 * Two refusals are the BE's, and the composer mirrors them up front rather than
 * letting the operator write a reply and only then be told:
 *   - the ticket did not arrive by email — there is nowhere to send it;
 *   - the ticket was merged — the conversation belongs on the winner.
 */
const REPLY_TO_TICKET = graphql(`
  mutation ReplyToTicket($ticketId: ID!, $body: String!) {
    replyToTicket(ticketId: $ticketId, body: $body) {
      ticket {
        _id
        status
        updatedAt
      }
      messages {
        ...TicketTimeline_message
      }
    }
  }
`);

export interface ReplyToTicketInput {
  ticketId: string;
  body: string;
}

export const useReplyToTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, body }: ReplyToTicketInput) =>
      execute(REPLY_TO_TICKET, { ticketId, body }),
    onSuccess: (_, vars) => {
      // The detail refetch is what repaints the thread. The list moves too:
      // replying bumps updatedAt, which the "Recently updated" sort reads.
      qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.ticketId) });
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};
