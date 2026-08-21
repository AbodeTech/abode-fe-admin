"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  ResolveTicketInput,
} from "@/lib/gql/graphql";
import { ticketKeys } from "./query-keys";

/**
 * Ticket mutations — every write invalidates both list + relevant
 * detail so the FE surface stays honest.
 */

const CREATE_TICKET = graphql(`
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      _id
      ticket_ref
    }
  }
`);

const UPDATE_TICKET = graphql(`
  mutation UpdateTicket($input: UpdateTicketInput!) {
    updateTicket(input: $input) {
      _id
      ticket_ref
      status
      subject
      category
      assigned_admin { _id userName email }
      user_affected { _id firstName lastName email }
      updatedAt
    }
  }
`);

const RESOLVE_TICKET = graphql(`
  mutation ResolveTicket($input: ResolveTicketInput!) {
    resolveTicket(input: $input) {
      _id
      ticket_ref
      status
      resolution
      resolved_at
      resolved_by { _id userName email }
    }
  }
`);

const ADD_TICKET_NOTE = graphql(`
  mutation AddTicketNote($ticketId: ID!, $body: String!) {
    addTicketNote(ticketId: $ticketId, body: $body) {
      _id
      body
      createdAt
      admin { _id userName email }
    }
  }
`);

const MERGE_TICKETS = graphql(`
  mutation MergeTickets($loserTicketId: ID!, $winnerTicketId: ID!) {
    mergeTickets(loserTicketId: $loserTicketId, winnerTicketId: $winnerTicketId) {
      _id
      ticket_ref
      merged_into
    }
  }
`);

const LINK_TICKET_TO_ISSUE = graphql(`
  mutation LinkTicketToIssue($ticketId: ID!, $issueId: ID!) {
    linkTicketToIssue(ticketId: $ticketId, issueId: $issueId) {
      _id
      issue { _id issue_ref title status }
    }
  }
`);

const UNLINK_TICKET_FROM_ISSUE = graphql(`
  mutation UnlinkTicketFromIssue($ticketId: ID!) {
    unlinkTicketFromIssue(ticketId: $ticketId) {
      _id
      issue { _id issue_ref title status }
    }
  }
`);

const invalidateAll = (
  qc: ReturnType<typeof useQueryClient>,
  ticketId?: string
) => {
  qc.invalidateQueries({ queryKey: ticketKeys.lists() });
  if (ticketId) {
    qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
  }
};

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) =>
      execute(CREATE_TICKET, { input }),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTicketInput) =>
      execute(UPDATE_TICKET, { input }),
    onSuccess: (data) =>
      invalidateAll(qc, data.updateTicket._id),
  });
};

export const useResolveTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveTicketInput) =>
      execute(RESOLVE_TICKET, { input }),
    onSuccess: (data) =>
      invalidateAll(qc, data.resolveTicket._id),
  });
};

export interface AddTicketNoteInput {
  ticketId: string;
  body: string;
}

export const useAddTicketNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, body }: AddTicketNoteInput) =>
      execute(ADD_TICKET_NOTE, { ticketId, body }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.ticketId) }),
  });
};

export interface MergeTicketsInput {
  loserTicketId: string;
  winnerTicketId: string;
}

export const useMergeTickets = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loserTicketId, winnerTicketId }: MergeTicketsInput) =>
      execute(MERGE_TICKETS, { loserTicketId, winnerTicketId }),
    onSuccess: (_, vars) => {
      invalidateAll(qc, vars.loserTicketId);
      qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.winnerTicketId) });
    },
  });
};

export interface LinkTicketToIssueInput {
  ticketId: string;
  issueId: string;
}

export const useLinkTicketToIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, issueId }: LinkTicketToIssueInput) =>
      execute(LINK_TICKET_TO_ISSUE, { ticketId, issueId }),
    onSuccess: (_, vars) => invalidateAll(qc, vars.ticketId),
  });
};

export const useUnlinkTicketFromIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      execute(UNLINK_TICKET_FROM_ISSUE, { ticketId }),
    onSuccess: (_, ticketId) => invalidateAll(qc, ticketId),
  });
};
