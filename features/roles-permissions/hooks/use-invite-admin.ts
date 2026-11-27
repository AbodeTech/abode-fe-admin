'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { InviteAdminResultSchema, type InviteAdminPayload } from '../schemas/admin-access.schema';
import { rolesKeys } from './query-keys';

/**
 * POST /admin/invite — create an admin with a temporary password and email it. Takes
 * `manage_admins`.
 *
 * `role_ids` is every role to give them, the FIRST being the primary role (its landing
 * page is where they start). The BE answers 409 when the email is already registered and
 * 403 when a non-super-admin tries to hand out a super-admin role. The new admin must change
 * the temporary password at first sign-in.
 *
 * Replaces the GraphQL `createSubAdmin` mutation, which sent the v1 role names `admin` or
 * `subadmin` and cannot reach the REST backend.
 */
export const useInviteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteAdminPayload) =>
      // Exactly the DTO's fields: the BE sets forbidNonWhitelisted.
      apiPost('/admin/invite', { email: payload.email, role_ids: payload.role_ids }, InviteAdminResultSchema),
    onSuccess: () => {
      // The admins list and each role's admin count both change.
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};
