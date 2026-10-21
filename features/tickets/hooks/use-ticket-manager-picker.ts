'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

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

// The BE's AdminMinDto: `id` and snake_case names, not an AdminRef. A manager
// whose admin record is gone comes back null.
const CSManagerRowSchema = z.looseObject({
  manager: z
    .looseObject({
      id: z.string(),
      user_name: z.string().nullish(),
      first_name: z.string().nullish(),
      last_name: z.string().nullish(),
      email: z.string().nullish(),
    })
    .nullable(),
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
    .flatMap(({ manager }) =>
      manager
        ? [
            {
              id: manager.id,
              label:
                manager.user_name ||
                `${manager.first_name ?? ''} ${manager.last_name ?? ''}`.trim() ||
                manager.email ||
                manager.id,
            },
          ]
        : []
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  return { options, isLoading: query.isLoading };
};
