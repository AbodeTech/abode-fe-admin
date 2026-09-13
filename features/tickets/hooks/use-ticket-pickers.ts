'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { AdminRefSchema, UserRefSchema } from '../schemas/ticket.schema';
import { ticketKeys } from './query-keys';

/**
 * The two people-pickers the ticket dialogs need: an admin to assign or pull
 * in, and a customer to link a ticket to.
 *
 * Admins are fetched once and filtered in memory — the roster is small and
 * there is no search endpoint for it. Customers are searched server-side,
 * because there are hundreds of thousands.
 */

const AdminOptionSchema = AdminRefSchema.extend({
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
});

export interface TicketAdminOption {
  _id: string;
  displayName: string;
  email: string;
  role?: string | null;
}

const adminLabel = (a: z.infer<typeof AdminOptionSchema>) =>
  a.userName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || a.email || a._id;

/** GET /admin/admins — the whole roster, filtered client-side. */
export const useTicketAdminPicker = (query: string) => {
  const q = query.trim().toLowerCase();

  const result = useQuery({
    queryKey: ticketKeys.adminPicker(),
    queryFn: () => apiGet('/admin/admins', z.array(AdminOptionSchema)),
    // Who is an admin changes rarely; the dialog reopens often.
    staleTime: 5 * 60 * 1000,
  });

  const all: TicketAdminOption[] = (result.data ?? []).map((a) => ({
    _id: a._id,
    displayName: adminLabel(a),
    email: a.email ?? '',
    role: typeof a.role === 'string' ? a.role : null,
  }));

  const data = q
    ? all.filter(
        (a) => a.displayName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      )
    : all;

  return { data, isLoading: result.isLoading };
};

export interface TicketUserOption {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
}

/**
 * GET /admin/users?search= — server-side, and only past two characters. A
 * one-letter search would page the entire customer base back.
 */
export const useTicketUserSearch = (query: string, limit = 10) => {
  const q = query.trim();

  const result = useQuery({
    queryKey: ticketKeys.userSearch(q, limit),
    queryFn: () =>
      apiGetPaged('/admin/users', UserRefSchema, {
        params: { page: 1, limit, search: q },
      }),
    enabled: q.length > 2,
  });

  // Every field is nullable on the wire; keep only rows with a real id and
  // email so the picker never renders a ghost.
  const data: TicketUserOption[] = (result.data?.items ?? [])
    .filter((u) => !!u._id && !!u.email)
    .map((u) => ({
      _id: u._id,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: u.email as string,
      phoneNumber: u.phoneNumber ?? null,
    }));

  return { data, isLoading: result.isLoading };
};
