'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import {
  TicketDetailSchema,
  TicketIssueSuggestionSchema,
  TicketListSchema,
  TicketQueueStatsSchema,
  TicketUserSuggestionSchema,
  type TicketChannel,
  type TicketFilter,
  type TicketSort,
  type TicketType,
} from '../schemas/ticket.schema';
import { ticketKeys } from './query-keys';

/**
 * Ticket reads.
 *
 * A ticket IS a threaded conversation — `messages` carries it, oldest first,
 * and a ticket opened before threading simply has one. `body` stays as the
 * denormalised text of the message that opened it: it is what the text index
 * searches and what the classifier reads, not a second source of truth.
 *
 * Everything here is scoped server-side to what the caller may reach. There is
 * no "show me everything" parameter, by design — see
 * docs/TICKETS-REST-CONTRACT.md.
 */

export const DEFAULT_TICKETS_LIMIT = 25;

export interface TicketListFilters {
  filter?: TicketFilter | null;
  category?: string | null;
  type?: TicketType | null;
  channel?: TicketChannel | null;
  /** Who is WORKING it. */
  assignedAdminId?: string | null;
  /** Whose CUSTOMER it is about — a different question, and both are wanted. */
  csManagerId?: string | null;
  issueId?: string | null;
  search?: string | null;
  sort?: TicketSort | null;
}

export interface UseTicketsParams {
  filter?: TicketListFilters;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/** GET /admin/tickets — rows and the eight chip counts in one response. */
export const useTickets = ({
  filter,
  page = 1,
  limit = DEFAULT_TICKETS_LIMIT,
  enabled = true,
}: UseTicketsParams = {}) =>
  useQuery({
    queryKey: ticketKeys.list({ filter, page, limit }),
    queryFn: () =>
      apiGet('/admin/tickets', TicketListSchema, {
        params: {
          page,
          limit,
          filter: filter?.filter || undefined,
          category: filter?.category || undefined,
          type: filter?.type || undefined,
          channel: filter?.channel || undefined,
          assigned_admin_id: filter?.assignedAdminId || undefined,
          cs_manager_id: filter?.csManagerId || undefined,
          issue_id: filter?.issueId || undefined,
          search: filter?.search?.trim() || undefined,
          sort: filter?.sort || undefined,
        },
      }),
    enabled,
  });

/** GET /admin/tickets/:id — accepts an id or a `TKT-######` ref. */
export const useTicket = (ticketId: string | null | undefined) =>
  useQuery({
    queryKey: ticketKeys.detail(ticketId ?? ''),
    queryFn: () => apiGet(`/admin/tickets/${ticketId}`, TicketDetailSchema),
    enabled: !!ticketId,
  });

/**
 * GET /admin/tickets/stats — the strip above the table.
 *
 * Scoped identically to the list, so it can never advertise a backlog the
 * reader has no way to open.
 */
export const useTicketQueueStats = () =>
  useQuery({
    queryKey: ticketKeys.queueStats(),
    queryFn: () => apiGet('/admin/tickets/stats', TicketQueueStatsSchema),
  });

/**
 * GET /admin/tickets/categories — the list the classifier is constrained to.
 *
 * Free-typed categories would sit outside the set the model can produce, which
 * quietly corrupts the ai-vs-human comparison `category_source` exists for.
 */
export const useTicketCategories = (enabled = true) =>
  useQuery({
    queryKey: ticketKeys.categories(),
    queryFn: () => apiGet('/admin/tickets/categories', z.array(z.string())),
    // A constant per deploy — no reason to refetch it on every drawer open.
    staleTime: Infinity,
    enabled,
  });

/** GET /admin/tickets/:id/suggest-users — ranked, never auto-applied. */
export const useTicketUserSuggestions = (ticketId: string | null | undefined, enabled = true) =>
  useQuery({
    queryKey: ticketKeys.userSuggestions(ticketId ?? ''),
    queryFn: () =>
      apiGet(`/admin/tickets/${ticketId}/suggest-users`, z.array(TicketUserSuggestionSchema)),
    enabled: !!ticketId && enabled,
  });

/** GET /admin/tickets/:id/suggest-issues — keyword-matched open issues, top 3. */
export const useTicketIssueSuggestions = (ticketId: string | null | undefined, enabled = true) =>
  useQuery({
    queryKey: ticketKeys.issueSuggestions(ticketId ?? ''),
    queryFn: () =>
      apiGet(`/admin/tickets/${ticketId}/suggest-issues`, z.array(TicketIssueSuggestionSchema)),
    enabled: !!ticketId && enabled,
  });
