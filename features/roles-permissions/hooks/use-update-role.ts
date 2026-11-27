'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPatch } from '@/lib/api-client';
import { z } from 'zod';

import { RoleSchema, type UpdateRolePayload } from '../schemas/role.schema';
import { rolesKeys } from './query-keys';

/**
 * PATCH /admin/roles/:id — change a role's description, permissions or landing page. Takes
 * `manage_roles`.
 *
 * There is no `name`: a role cannot be renamed, and the BE refuses a body that carries one.
 * The super-admin role cannot be edited at all (400 `SUPER_ADMIN_IMMUTABLE`); system roles can.
 * A permission change reaches everyone who holds the role on their next request, and is logged
 * with the keys before and after.
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, ...payload }: { roleId: string } & UpdateRolePayload) =>
      apiPatch(`/admin/roles/${roleId}`, payload, RoleSchema),
    onSuccess: () => {
      // Role cards, the admins table (role names and effective keys) and the pickers all read roles.
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};

/**
 * DELETE /admin/roles/:id — a custom role nobody holds. Takes `manage_roles`.
 *
 * The BE answers 400 for the super-admin role, for any system role, and for a role that still
 * has admins (`ROLE_HAS_ASSIGNED_ADMINS`, with the admins in `details`). The caller shows the
 * message as it is.
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) =>
      apiDelete(`/admin/roles/${roleId}`, z.looseObject({ message: z.string().optional() })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};
