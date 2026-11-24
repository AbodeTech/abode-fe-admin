'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';
import { AdminAccountSchema } from '../schemas/role.schema';
import { rolesKeys } from './query-keys';

/**
 * PATCH /admin/admins/:id/role — replace every role an admin holds (`role_ids`;
 * the first is the primary role). Takes `manage_roles`.
 *
 * The BE refuses to change your OWN roles, and only a super admin may assign a
 * super-admin role (both are 4xx with a readable message).
 *
 * The BE refuses to let you change your OWN role, and bumps the target's
 * session so the new permissions take effect immediately rather than at their
 * next login. Invalidating the whole feature keeps the roles' `admin_count`
 * honest as well as the row itself.
 */
export const useUpdateAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, roleIds }: { adminId: string; roleIds: string[] }) =>
      // Exactly the DTO's field: the BE sets forbidNonWhitelisted.
      apiPatch(`/admin/admins/${adminId}/role`, { role_ids: roleIds }, AdminAccountSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};
