'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import {
  AdminAccountSchema,
  joinAdminRole,
  type AdminWithRole,
} from '../schemas/role.schema';
import { rolesKeys } from './query-keys';
import { useRoles } from './use-roles';

/** GET /admin/admins — raw accounts, role unresolved. */
const useAdminAccounts = () =>
  useQuery({
    queryKey: rolesKeys.adminAccounts,
    queryFn: () => apiGet('/admin/admins', z.array(AdminAccountSchema)),
  });

/**
 * Every admin with their role name and permissions resolved.
 *
 * Two requests joined on the client, because `GET /admin/admins` returns the
 * role as a bare ObjectId and no permissions at all — v1's `AdminRoles` type
 * was flattened server-side and has no REST equivalent. The roles list is small
 * and cached, so this costs one extra request per session rather than per row.
 *
 * Rows render as soon as the accounts land; a row whose role hasn't resolved
 * yet shows the raw id rather than blocking the table.
 */
export const useAdminsWithRoles = () => {
  const accounts = useAdminAccounts();
  const roles = useRoles();

  const data: AdminWithRole[] | undefined = accounts.data?.map((account) =>
    joinAdminRole(account, roles.data)
  );

  return {
    data,
    isLoading: accounts.isLoading || roles.isLoading,
    error: accounts.error ?? roles.error,
  };
};
