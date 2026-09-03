'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  AdminAccountSchema,
  joinAdminRole,
  type AdminWithRole,
} from '../schemas/role.schema';
import { rolesKeys } from './query-keys';
import { useRoles } from './use-roles';

/**
 * GET /admin/admins/:id, with the role joined the same way the list does it.
 *
 * The account alone carries a bare role id and no permissions, so the roles
 * list is needed to render either.
 */
export const useAdminWithRole = (adminId: string | null | undefined) => {
  const account = useQuery({
    queryKey: rolesKeys.admin(adminId ?? ''),
    queryFn: () => apiGet(`/admin/admins/${adminId}`, AdminAccountSchema),
    enabled: !!adminId,
  });
  const roles = useRoles();

  const data: AdminWithRole | undefined = account.data
    ? joinAdminRole(account.data, roles.data)
    : undefined;

  return {
    data,
    isLoading: account.isLoading || roles.isLoading,
    error: account.error ?? roles.error,
  };
};
