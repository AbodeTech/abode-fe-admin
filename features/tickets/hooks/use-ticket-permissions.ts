'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

import { ticketKeys } from './query-keys';

/**
 * What the signed-in admin may be SHOWN on the ticket surface.
 *
 * Three capabilities, and they gate different things:
 *
 *   canManageAllTickets  reads and acts on every ticket, whoever owns it.
 *   canRouteTickets      also sees the unassigned pool — the person who hands
 *                        new tickets out. Decides which queue chips and manager
 *                        filters are worth drawing at all.
 *   canDecideRouting     may classify, categorise, assign, group and resolve.
 *
 * The first two are permissions, read from the session the store already holds.
 * The third is not a permission: on the BE it is an active CS Manager
 * assignment, so it is answered by asking whether this admin appears in the
 * CS Manager roster.
 *
 * None of this is a security boundary. Every gate is re-decided server-side
 * against the row, and the list itself is scoped — a hidden control and a
 * hand-made request fail the same way. This only decides what to render.
 */

const CSManagerIdSchema = z.looseObject({
  manager: z.looseObject({ _id: z.string() }),
});

export const useTicketPermissions = () => {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role?.is_super_admin ?? false;

  const canManageAllTickets = isSuperAdmin || permissions.includes('manage_all_tickets');
  const canRouteTickets = canManageAllTickets || permissions.includes('route_tickets');

  // Only asked when it could change the answer — a super admin already may.
  const roster = useQuery({
    queryKey: ticketKeys.managerPicker(),
    queryFn: () => apiGet('/admin/cs-managers', z.array(CSManagerIdSchema)),
    staleTime: 5 * 60 * 1000,
    enabled: !canManageAllTickets && !!user?.id,
  });

  const isCSManager = (roster.data ?? []).some((r) => r.manager._id === user?.id);

  return {
    canManageAllTickets,
    canRouteTickets,
    canDecideRouting: canManageAllTickets || isCSManager,
    isCSManager,
    /**
     * Everything defaults to false while the session is loading, on purpose:
     * restricted controls stay hidden and then appear, rather than flashing up
     * and being taken away.
     */
    isLoading: roster.isLoading,
  };
};
