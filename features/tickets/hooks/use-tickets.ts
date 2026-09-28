"use client";

import { useQuery } from "@tanstack/react-query";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { TicketListFilterInput } from "@/lib/gql/graphql";
import { ticketKeys } from "./query-keys";

/**
 * Ticket reads.
 *
 * A ticket IS a threaded conversation now — `messages` carries it, oldest
 * first, and a ticket opened before threading simply has one. `body` stays
 * as the denormalised text of the message that opened it: it is what the
 * text index searches and what the classifier reads, so it is not a second
 * source of truth for the conversation.
 *
 * `duplicates` outlived its original job (the stand-in for threading) and is
 * now only what it says — recent open tickets from the same source address,
 * i.e. merge candidates.
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
      messages {
        ...TicketTimeline_message
      }
      notes {
        ...TicketTimeline_note
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

/**
 * The numbers above the table.
 *
 * Scoped by the BE exactly as the table beneath it is — a CS Manager reads the
 * book, everyone else reads their own work — so the strip can never advertise a
 * backlog the reader has no way to open.
 */
// NOTE: parsed by hand rather than through codegen, because the filter
// argument and the awaitingReply/matching fields are not on the schema codegen
// introspects until the BE change ships. Same convention as the company-events
// hooks; switch it back to graphql() once it is on staging.
const TICKET_QUEUE_STATS = parse(`
  query TicketQueueStats($filter: TicketListFilterInput) {
    ticketQueueStats(filter: $filter) {
      matching
      open
      inProgress
      waitingCustomer
      awaitingReply
      oldestAwaitingHours
      resolvedLast7Days
    }
  }
`) as unknown as TypedDocumentNode<
  { ticketQueueStats: TicketQueueStats },
  { filter?: TicketQueueStatsFilter | null }
>;

/**
 * What the tiles report, and what they mean.
 *
 * `awaitingReply` is whose court the ticket is in — never answered, or the
 * customer has written since we last did — and replaces a tile that counted
 * everything unresolved for more than 48 hours. On production that was 88% of
 * the queue, so it was always lit and pointed at nothing.
 */
export interface TicketQueueStats {
  /** Tickets the current filters match, so the strip and the table agree. */
  matching: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  awaitingReply: number;
  oldestAwaitingHours: number | null;
  resolvedLast7Days: number;
}

/** The narrowing half of the list's filter — the chip is ignored server-side. */
export interface TicketQueueStatsFilter {
  category?: string | null;
  type?: string | null;
  channel?: string | null;
  assignedAdminId?: string | null;
  csManagerId?: string | null;
  issueId?: string | null;
  search?: string | null;
  /** Inclusive day bounds on when the ticket came in, as yyyy-mm-dd. */
  from?: string | null;
  to?: string | null;
}

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

// NOTE: parsed by hand for the same reason as TICKET_QUEUE_STATS — the query
// is not on the schema codegen introspects until the BE change ships.
const TICKET_MONTHLY_FLOW = parse(`
  query TicketMonthlyFlow($months: Int) {
    ticketMonthlyFlow(months: $months) {
      month
      created
      resolved
    }
  }
`) as unknown as TypedDocumentNode<
  { ticketMonthlyFlow: TicketMonthlyFlowPoint[] },
  { months?: number }
>;

/** One month: what arrived, and what was cleared — not the same tickets. */
export interface TicketMonthlyFlowPoint {
  /** yyyy-mm, in Lagos time. */
  month: string;
  created: number;
  resolved: number;
}

/**
 * `ticketMonthlyFlow` — the shape that says whether support is keeping up.
 *
 * Scoped by the BE to what the reader can open, like every other ticket read.
 */
export const useTicketMonthlyFlow = (months = 6, enabled = true) =>
  useQuery({
    queryKey: [...ticketKeys.root(), "monthly-flow", months] as const,
    queryFn: () => execute(TICKET_MONTHLY_FLOW, { months }),
    select: (data) => data.ticketMonthlyFlow,
    // Two aggregations over every ticket the reader can see. Nobody should pay
    // for them on a screen they opened to answer a customer.
    enabled,
  });

/**
 * The tiles, narrowed the same way the list is.
 *
 * The filter is part of the query key, so narrowing refetches rather than
 * serving the whole book's numbers from cache under a filtered table.
 */
export const useTicketQueueStats = (filter?: TicketQueueStatsFilter | null) =>
  useQuery({
    queryKey: ticketKeys.queueStats(filter ?? undefined),
    queryFn: () => execute(TICKET_QUEUE_STATS, { filter: filter ?? null }),
    select: (data) => data.ticketQueueStats,
    // Keeps the previous numbers on screen while a narrowed set loads, instead
    // of blanking the strip on every keystroke of the search box.
    placeholderData: (prev) => prev,
  });

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
