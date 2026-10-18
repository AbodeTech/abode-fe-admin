'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { ManagerProfileSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * GET /admin/managers/me — whether the signed-in admin manages a team, and
 * which manager they are.
 *
 * Deliberately a 200 with `is_manager: false` for a non-manager rather than a
 * 403, so "no" is an answer rather than an error. Returning the caller's own
 * manager id is what makes the `/:manager_id/` routes — rating series included
 * — callable for oneself.
 */
export const useManagerMe = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: managerKeys.me(),
    queryFn: () => apiGet('/admin/managers/me', ManagerProfileSchema),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
