'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';
import { AdminAccountSchema } from '../schemas/role.schema';
import { rolesKeys } from './query-keys';

/**
 * PATCH /admin/admins/:id/role — reassign an admin. Takes `manage_roles`.
 *
 * The BE refuses to let you change your OWN role, and bumps the target's
 * session so the new permissions take effect immediately rather than at their
 * next login. Invalidating the whole feature keeps the roles' `admin_count`
 * honest as well as the row itself.
 */
export const useUpdateAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, roleId }: { adminId: string; roleId: string }) =>
      apiPatch(`/admin/admins/${adminId}/role`, { role_id: roleId }, AdminAccountSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};
