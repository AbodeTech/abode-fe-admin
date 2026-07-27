'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGetPaged } from '@/lib/api-client';

/* ============================================================
 * Referrer lookup for the override pickers.
 *
 * ⛔ ticket 2 — `GET /admin/users` is a stub on abode-be-v2. It is guarded and
 * validates its DTO, then returns `{ message, dto }` without touching the
 * database. So this resolves in mock mode and fails against a real backend
 * until AdminController is wired to UserService.
 *
 * The picker degrades rather than blocking: when search returns nothing, an
 * admin who already has a user id can enter it directly (see UserPicker).
 * ============================================================ */

const UserOptionSchema = z.object({
  _id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  referral_status: z.string().nullable().optional(),
});

export type UserOption = {
  id: string;
  label: string;
  /** Tier, shown so an admin can tell two similarly-named referrers apart. */
  hint: string | null;
};

const OPTION_LIMIT = 20;

export const useUserOptions = (search: string, enabled = true) =>
  useQuery({
    queryKey: ['commission', 'user-options', search],
    queryFn: () =>
      apiGetPaged('/admin/users', UserOptionSchema, {
        params: { search: search || undefined, limit: OPTION_LIMIT },
      }),
    enabled,
    // A stubbed endpoint shouldn't be retried three times per keystroke.
    retry: false,
    staleTime: 30_000,
    select: (data): UserOption[] =>
      data.items.map((user) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        return {
          id: user._id,
          label: name || user.email || user._id,
          hint: user.email && name ? user.email : (user.referral_status ?? null),
        };
      }),
  });
