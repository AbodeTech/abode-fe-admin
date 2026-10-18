'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';
import {
  AdminUserRowSchema,
  normalizeAdminUserRow,
} from '@/features/users/schemas/user.schema';

/* ============================================================
 * User lookup for admin pickers — GET /admin/users (UserRowDto).
 * Names render lastName firstName, the platform convention.
 * ============================================================ */

export type UserOption = {
  id: string;
  label: string;
  hint: string | null;
  tier: string | null;
};

const OPTION_LIMIT = 20;

export const useUserOptions = (search: string, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'user-options', search],
    queryFn: () =>
      apiGetPaged('/admin/users', AdminUserRowSchema, {
        params: { search: search || undefined, limit: OPTION_LIMIT },
      }),
    enabled,
    retry: false,
    staleTime: 30_000,
    select: (data): UserOption[] =>
      data.items.map((raw) => {
        const user = normalizeAdminUserRow(raw);
        const name = [user.last_name, user.first_name].filter(Boolean).join(' ').trim();
        return {
          id: user.id,
          label: name || user.email || user.id,
          hint: user.email && name ? user.email : (user.tier || null),
          tier: user.tier || null,
        };
      }),
  });
