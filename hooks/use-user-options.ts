'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGetPaged } from '@/lib/api-client';

/* ============================================================
 * User lookup for admin pickers — "find me the person this applies to".
 *
 * Shared rather than feature-owned because more than one feature needs to
 * identify a user by name: the commission override subjects and the upgrade
 * queue's manual upgrade. It reads `GET /admin/users`, which was a stub until
 * 2026-08-13 (ticket 2) and is now wired to `AdminService.listUsers`.
 *
 * Names render **lastName firstName**, the platform convention.
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
  /** Tier, shown so an admin can tell two similarly-named people apart. */
  hint: string | null;
  /** Kept so a caller can act on the tier without a second lookup. */
  tier: string | null;
};

const OPTION_LIMIT = 20;

export const useUserOptions = (search: string, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'user-options', search],
    queryFn: () =>
      apiGetPaged('/admin/users', UserOptionSchema, {
        params: { search: search || undefined, limit: OPTION_LIMIT },
      }),
    enabled,
    // One request per settled keystroke, not three.
    retry: false,
    staleTime: 30_000,
    select: (data): UserOption[] =>
      data.items.map((user) => {
        const name = [user.lastName, user.firstName].filter(Boolean).join(' ').trim();
        return {
          id: user._id,
          label: name || user.email || user._id,
          hint: user.email && name ? user.email : (user.referral_status ?? null),
          tier: user.referral_status ?? null,
        };
      }),
  });
