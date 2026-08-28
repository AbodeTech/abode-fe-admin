"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { TicketListFilterInput } from "@/lib/gql/graphql";
import { ticketKeys } from "./query-keys";

/**
 * Ticket reads.
 *
 * The complaint log is deliberately NOT a threaded conversation — one
 * inbound message is one ticket. `duplicates` on the detail response is
 * the cheap stand-in for threading (recent open tickets from the same
 * source address).
 *
 * BE contract: adminTypeDefs.ts §"Tickets".
 */

const TICKET_ROW_FIELDS = `
  _id
  ticket_ref
  channel
  source_reference
  subject
  body
  category
  status
  resolution
  resolved_at
  merged_into
  createdAt
  updatedAt
  sender { _id firstName lastName email }
  user_affected { _id firstName lastName email phoneNumber }
  assigned_admin { _id userName email }
  collaborators { _id userName email role }
  issue { _id issue_ref title status }
  attachments { url filename mime size }
  resolved_by { _id userName email }
`;

const GET_TICKETS = graphql(`
  query GetTickets($filter: TicketListFilterInput, $page: Int, $limit: Int) {
    getTickets(filter: $filter, page: $page, limit: $limit) {
      count
      results {
        _id
        ticket_ref
        channel
        source_reference
        subject
        body
        category
        type
        category_source
        type_source
        status
        resolution
        resolved_at
        merged_into
        createdAt
        updatedAt
        sender { _id firstName lastName email }
        user_affected { _id firstName lastName email phoneNumber }
        assigned_admin { _id userName email }
        collaborators { _id userName email role }
        issue { _id issue_ref title status }
      }
      filterCounts {
        all
        mine
        unassigned
        unlinked
        open
        waitingCustomer
        blockedOnIssue
        resolved
      }
    }
  }
`);

const GET_TICKET = graphql(`
  query GetTicket($ticketId: ID!) {
    getTicket(ticketId: $ticketId) {
      ticket {
        _id
        ticket_ref
        channel
        source_reference
        subject
        body
        category
        type
        category_source
        type_source
        ai {
          suggested_category
          suggested_type
          confidence
          model
          classified_at
          error
          affected_hints { value kind note }
        }
        status
        resolution
        resolved_at
        merged_into
        createdAt
        updatedAt
        sender { _id firstName lastName email }
        user_affected { _id firstName lastName email phoneNumber }
        assigned_admin { _id userName email }
        collaborators { _id userName email role }
        issue { _id issue_ref title status }
        attachments { url filename mime size }
        resolved_by { _id userName email }
      }
      notes {
        _id
        body
        createdAt
        admin { _id userName email }
      }
      duplicates {
        _id
        ticket_ref
        subject
        status
        createdAt
      }
      csManager {
        _id
        userName
        email
      }
    }
  }
`);

const SUGGEST_USERS_FOR_TICKET = graphql(`
  query SuggestUsersForTicket($ticketId: ID!) {
    suggestUsersForTicket(ticketId: $ticketId) {
      reason
      confidence
      user {
        _id
        firstName
        lastName
        email
        phoneNumber
      }
    }
  }
`);

const FIND_SIMILAR_TICKETS = graphql(`
  query FindSimilarTickets($search: String!) {
    findSimilarTickets(search: $search) {
      _id
      ticket_ref
      subject
      status
      createdAt
      user_affected { _id firstName lastName email }
    }
  }
`);

/**
 * The category list the classifier is constrained to. Free-typed categories
 * would sit outside the set the model can produce, which quietly corrupts the
 * ai-vs-human comparison that category_source exists to enable.
 */
const TICKET_CATEGORIES = graphql(`
  query TicketCategories {
    ticketCategories
  }
`);

/** Candidate issues by keyword overlap. Suggestion only — nothing is linked. */
const SUGGEST_ISSUES_FOR_TICKET = graphql(`
  query SuggestIssuesForTicket($ticketId: ID!) {
    suggestIssuesForTicket(ticketId: $ticketId) {
      matchedTerms
      score
      issue { _id issue_ref title status }
    }
  }
`);

export const DEFAULT_TICKETS_LIMIT = 25;

export interface UseTicketsParams {
  filter?: TicketListFilterInput;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useTickets = ({
  filter,
  page = 1,
  limit = DEFAULT_TICKETS_LIMIT,
  enabled = true,
}: UseTicketsParams = {}) => {
  return useQuery({
    queryKey: ticketKeys.list({ filter, page, limit }),
    queryFn: () =>
      execute(GET_TICKETS, { filter: filter ?? null, page, limit }),
    select: (data) => data.getTickets,
    enabled,
  });
};

export const useTicket = (ticketId: string | null | undefined) => {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId ?? ""),
    queryFn: () => execute(GET_TICKET, { ticketId: ticketId as string }),
    select: (data) => data.getTicket,
    enabled: !!ticketId,
  });
};

export const useTicketUserSuggestions = (
  ticketId: string | null | undefined,
  enabled = true
) => {
  return useQuery({
    queryKey: ticketKeys.userSuggestions(ticketId ?? ""),
    queryFn: () =>
      execute(SUGGEST_USERS_FOR_TICKET, { ticketId: ticketId as string }),
    select: (data) => data.suggestUsersForTicket,
    enabled: !!ticketId && enabled,
  });
};

export const useSimilarTickets = (search: string, enabled = true) => {
  return useQuery({
    queryKey: ticketKeys.similar(search),
    queryFn: () => execute(FIND_SIMILAR_TICKETS, { search }),
    select: (data) => data.findSimilarTickets,
    enabled: enabled && search.trim().length > 2,
  });
};

// TICKET_ROW_FIELDS is left as an inline reference for consistency;
// individual queries above spell fields out so codegen infers narrower
// operation types.
void TICKET_ROW_FIELDS;

export const useTicketCategories = (enabled = true) =>
  useQuery({
    queryKey: ticketKeys.categories(),
    queryFn: () => execute(TICKET_CATEGORIES, {}),
    select: (data) => data.ticketCategories,
    // A constant per deploy — no reason to refetch it on every drawer open.
    staleTime: Infinity,
    enabled,
  });

export const useTicketIssueSuggestions = (
  ticketId: string | null | undefined,
  enabled = true
) =>
  useQuery({
    queryKey: ticketKeys.issueSuggestions(ticketId ?? ""),
    queryFn: () =>
      execute(SUGGEST_ISSUES_FOR_TICKET, { ticketId: ticketId as string }),
    select: (data) => data.suggestIssuesForTicket,
    enabled: !!ticketId && enabled,
  });
