'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { PermissionOptionSchema } from '../schemas/role.schema';
import { rolesKeys } from './query-keys';

/**
 * GET /admin/permissions — every permission the system defines, with the
 * description used as tooltip copy in the role editor.
 *
 * The endpoint also accepts `?format=names` for v1's bare string array. Not
 * used here: the objects are the point, and the param exists so the FE could
 * cut over without a lockstep deploy — which this is.
 */
export const usePermissions = () =>
  useQuery({
    queryKey: rolesKeys.permissions,
    queryFn: () => apiGet('/admin/permissions', z.array(PermissionOptionSchema)),
    staleTime: 10 * 60 * 1000,
  });
