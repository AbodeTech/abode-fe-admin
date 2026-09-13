'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';

import {
  TicketNoteSchema,
  TicketSchema,
  type TicketStatus,
  type TicketType,
} from '../schemas/ticket.schema';
import { issueKeys, ticketKeys } from './query-keys';

/**
 * Ticket writes.
 *
 * Two BE rules shape every call here, and neither is expressible client-side:
 *
 *   Reachability is checked before privilege. Holding the CS Manager role says
 *   which FIELDS you may change, never which tickets you may reach.
 *
 *   Privilege is per field. `status` and `subject` are working the ticket,
 *   which anyone on it may do; `category`, `type`, `assigned_admin_id` and
 *   `user_affected_id` are routing and belong to the CS Manager.
 *
 * Hiding a control is legibility. The refusal is the boundary. Toasts live at
 * the call site, not in here.
 */

/** A write can move the row, the chip counts and the strip — invalidate the lot. */
const useTicketInvalidator = () => {
  const queryClient = useQueryClient();
  return (ticketId?: string) => {
    queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ticketKeys.queueStats() });
    if (ticketId) queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
  };
};

export const useCreateTicket = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: (input: {
      channel: string;
      subject: string;
      body?: string;
      source_reference?: string;
      sender_id?: string;
      user_affected_id?: string;
      category?: string;
      attachments?: { url: string; filename?: string; mime?: string; size?: number }[];
    }) => apiPost('/admin/tickets', input, TicketSchema),
    onSuccess: () => invalidate(),
  });
};

export interface UpdateTicketInput {
  ticketId: string;
  subject?: string;
  /** `resolved` is refused — use resolve, so a resolution is recorded. */
  status?: Exclude<TicketStatus, 'resolved'>;
  category?: string | null;
  type?: TicketType | null;
  assigned_admin_id?: string | null;
  user_affected_id?: string | null;
  /**
   * The `updatedAt` the caller rendered. A mismatch is a 400 carrying
   * `code: 'TICKET_STALE_STATE'` — branch on the code, never the message.
   * Omitting it is last-write-wins, which is the wrong default for a queue two
   * people work.
   */
  expected_updated_at?: string;
}

export const useUpdateTicket = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ ticketId, ...body }: UpdateTicketInput) =>
      apiPatch(`/admin/tickets/${ticketId}`, body, TicketSchema),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

export const useResolveTicket = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({
      ticketId,
      ...body
    }: {
      ticketId: string;
      /** Minimum 20 characters, enforced server-side. */
      resolution: string;
      notify_user?: boolean;
      expected_updated_at?: string;
    }) => apiPost(`/admin/tickets/${ticketId}/resolve`, body, TicketSchema),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

/** Never overwrites a value a human has set. */
export const useClassifyTicket = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: (ticketId: string) =>
      apiPost(`/admin/tickets/${ticketId}/classify`, {}, TicketSchema),
    onSuccess: (_d, ticketId) => invalidate(ticketId),
  });
};

export interface AddTicketNoteInput {
  ticketId: string;
  /** Minimum 5 characters, enforced server-side. */
  body: string;
}

export const useAddTicketNote = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ ticketId, body }: AddTicketNoteInput) =>
      apiPost(`/admin/tickets/${ticketId}/notes`, { body }, z.array(TicketNoteSchema)),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

/** Own notes only, unless super admin. */
export const useEditTicketNote = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; ticketId?: string; body: string }) =>
      apiPatch(`/admin/tickets/notes/${noteId}`, { body }, TicketNoteSchema),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

/** Soft delete. Same rule. */
export const useDeleteTicketNote = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ noteId }: { noteId: string; ticketId?: string }) =>
      apiDelete(`/admin/tickets/notes/${noteId}`, z.unknown()),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

export interface MergeTicketsInput {
  loserTicketId: string;
  winnerTicketId: string;
}

/** Both sides are reachability-checked — a merge is not a way to read a ticket. */
export const useMergeTickets = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ loserTicketId, winnerTicketId }: MergeTicketsInput) =>
      apiPost(`/admin/tickets/${loserTicketId}/merge-into/${winnerTicketId}`, {}, TicketSchema),
    onSuccess: (_d, v) => invalidate(v.loserTicketId),
  });
};

export interface TicketCollaboratorInput {
  ticketId: string;
  adminId: string;
}

/** Idempotent, and rejects the current owner — they are already on it. */
export const useAddTicketCollaborator = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ ticketId, adminId }: TicketCollaboratorInput) =>
      apiPost(`/admin/tickets/${ticketId}/collaborators`, { admin_id: adminId }, TicketSchema),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

export const useRemoveTicketCollaborator = () => {
  const invalidate = useTicketInvalidator();
  return useMutation({
    mutationFn: ({ ticketId, adminId }: TicketCollaboratorInput) =>
      apiDelete(`/admin/tickets/${ticketId}/collaborators/${adminId}`, TicketSchema),
    onSuccess: (_d, v) => invalidate(v.ticketId),
  });
};

export type LinkTicketToIssueInput = { ticketId: string; issueId: string };

/** Re-exported so the issue write hooks stay in one import for components. */
export {
  useLinkTicketToIssue,
  useUnlinkTicketFromIssue,
} from './use-issues';

/** Every issue write can change a ticket's blocked state. */
export const ticketAndIssueKeys = { ticketKeys, issueKeys };
