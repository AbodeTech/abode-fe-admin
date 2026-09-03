'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import {
  RoleSchema,
  RoleWithAdminsSchema,
} from '../schemas/role.schema';
import { rolesKeys } from './query-keys';

/** GET /admin/roles — every role with its permissions and how many admins hold it. */
export const useRoles = () =>
  useQuery({
    queryKey: rolesKeys.roles,
    queryFn: () => apiGet('/admin/roles', z.array(RoleSchema)),
  });

/** GET /admin/roles/:id */
export const useRole = (roleId: string | null | undefined) =>
  useQuery({
    queryKey: rolesKeys.role(roleId ?? ''),
    queryFn: () => apiGet(`/admin/roles/${roleId}`, RoleSchema),
    enabled: !!roleId,
  });

/**
 * GET /admin/roles/:id/admins — the role plus the admins currently on it.
 *
 * Worth having before a delete: the BE refuses to remove a role that still has
 * admins, and its 400 carries them so they can be reassigned first.
 */
export const useRoleAdmins = (roleId: string | null | undefined) =>
  useQuery({
    queryKey: rolesKeys.roleAdmins(roleId ?? ''),
    queryFn: () => apiGet(`/admin/roles/${roleId}/admins`, RoleWithAdminsSchema),
    enabled: !!roleId,
  });
