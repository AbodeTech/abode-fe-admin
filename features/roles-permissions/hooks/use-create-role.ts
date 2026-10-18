'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { RoleSchema, type CreateRolePayload } from '../schemas/role.schema';
import { rolesKeys } from './query-keys';

/**
 * POST /admin/roles — a custom role. Takes `manage_roles`.
 *
 * `name` is lowercase snake_case and immutable once created, so it is worth
 * getting right at this step: there is no rename, by design.
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => apiPost('/admin/roles', payload, RoleSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.roles });
    },
  });
};
