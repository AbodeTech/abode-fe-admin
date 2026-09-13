'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { AdminRefSchema } from '../schemas/ticket.schema';
import { ticketKeys } from './query-keys';

/**
 * Active CS Managers, for the two manager filters above the ticket table.
 *
 * Only CS Managers, not every admin: the filters answer questions about a
 * manager's queue and a manager's book, and a list of every admin would bury
 * the handful of people either question is ever asked about.
 *
 * The tickets feature keeps its own query rather than importing the
 * cs-managers one — features are self-contained here, and this needs two
 * fields where that one pulls scores and portfolio counts it would discard.
 */

const CSManagerRowSchema = z.looseObject({
  manager: AdminRefSchema.extend({
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
  }),
});

export interface TicketManagerOption {
  id: string;
  label: string;
}

export const useTicketManagerPicker = (enabled = true) => {
  const query = useQuery({
    queryKey: ticketKeys.managerPicker(),
    queryFn: () => apiGet('/admin/cs-managers', z.array(CSManagerRowSchema)),
    // Who holds the role changes rarely, and the BE computes a score per
    // manager to answer this — not something to refetch on every mount.
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const options: TicketManagerOption[] = (query.data ?? [])
    .map((row) => ({
      id: row.manager._id,
      label:
        row.manager.userName ||
        `${row.manager.firstName ?? ''} ${row.manager.lastName ?? ''}`.trim() ||
        row.manager.email ||
        row.manager._id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { options, isLoading: query.isLoading };
};
