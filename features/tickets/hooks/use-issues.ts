'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

import {
  IssueDetailSchema,
  IssueListSchema,
  IssueSchema,
  IssueTicketRowSchema,
  ResolveIssueResultSchema,
  type IssueStatus,
} from '../schemas/ticket.schema';
import { issueKeys, ticketKeys } from './query-keys';

/**
 * Issues — the root-cause layer over the queue.
 *
 * Reads are open to any admin: a specialist working a ticket blocked on an
 * issue needs to see what they are blocked on. Writes are the CS Manager's,
 * refused server-side otherwise.
 */

export const DEFAULT_ISSUES_LIMIT = 20;

export const useIssues = ({
  status,
  search,
  page = 1,
  limit = DEFAULT_ISSUES_LIMIT,
  enabled = true,
}: {
  status?: IssueStatus | null;
  search?: string | null;
  page?: number;
  limit?: number;
  enabled?: boolean;
} = {}) =>
  useQuery({
    queryKey: issueKeys.list({ status, search, page, limit }),
    queryFn: () =>
      apiGet('/admin/issues', IssueListSchema, {
        params: {
          page,
          limit,
          status: status || undefined,
          search: search?.trim() || undefined,
        },
      }),
    enabled,
  });

export const useIssue = (issueId: string | null | undefined) =>
  useQuery({
    queryKey: issueKeys.detail(issueId ?? ''),
    queryFn: () => apiGet(`/admin/issues/${issueId}`, IssueDetailSchema),
    enabled: !!issueId,
  });

/**
 * GET /admin/issues/similar-tickets — unlinked, unresolved tickets matching
 * the text. For building an issue out of a cluster you can see.
 */
export const useSimilarTickets = (search: string, enabled = true) =>
  useQuery({
    queryKey: ticketKeys.similar(search),
    queryFn: () =>
      apiGet('/admin/issues/similar-tickets', z.array(IssueTicketRowSchema), {
        params: { search: search.trim() },
      }),
    enabled: enabled && search.trim().length > 2,
  });

/** Everything an issue write touches: the board, the issue, and every ticket list. */
const useIssueInvalidator = () => {
  const queryClient = useQueryClient();
  return (issueId?: string) => {
    queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    if (issueId) queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
    queryClient.invalidateQueries({ queryKey: ticketKeys.root() });
  };
};

export const useCreateIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description?: string | null;
      owner_id?: string | null;
      /** Promoting a ticket links it to the new issue in the same call. */
      from_ticket_id?: string | null;
    }) => apiPost('/admin/issues', input, IssueSchema),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: ({
      issueId,
      ...body
    }: {
      issueId: string;
      title?: string;
      description?: string | null;
      /** Refuses `resolved` — moving OFF resolved is recorded as a manual reopen. */
      status?: IssueStatus;
      owner_id?: string | null;
    }) => apiPatch(`/admin/issues/${issueId}`, body, IssueSchema),
    onSuccess: (_d, v) => invalidate(v.issueId),
  });
};

/**
 * Closes every linked ticket in one act.
 *
 * `confirm_customers_contacted` is required only when `notify_users` is false —
 * from the customer's side, being marked resolved in silence is
 * indistinguishable from being ignored.
 */
export const useResolveIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: ({
      issueId,
      ...body
    }: {
      issueId: string;
      resolution_note: string;
      exclude_ticket_ids?: string[];
      notify_users?: boolean;
      confirm_customers_contacted?: boolean;
    }) => apiPost(`/admin/issues/${issueId}/resolve`, body, ResolveIssueResultSchema),
    onSuccess: (_d, v) => invalidate(v.issueId),
  });
};

/**
 * POST /admin/issues/:id/tickets/:ticket_id
 *
 * Fault-type only, and the BE enforces it now rather than advising. A resolved
 * issue AUTO-REOPENS: a new fault on a closed incident is a recurrence.
 */
export const useLinkTicketToIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: ({ ticketId, issueId }: { ticketId: string; issueId: string }) =>
      apiPost(`/admin/issues/${issueId}/tickets/${ticketId}`, {}, z.unknown()),
    onSuccess: (_d, v) => invalidate(v.issueId),
  });
};

/** DELETE /admin/issues/tickets/:ticket_id — the issue id is not needed. */
export const useUnlinkTicketFromIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: (ticketId: string) =>
      apiDelete(`/admin/issues/tickets/${ticketId}`, z.unknown()),
    onSuccess: () => invalidate(),
  });
};
