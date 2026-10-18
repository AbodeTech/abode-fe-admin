'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged, apiGet } from '@/lib/api-client';

import { ManagerListItemSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

export const DEFAULT_MANAGER_LIST_LIMIT = 20;

interface UseAssociateManagersParams {
  page?: number;
  limit?: number;
  q?: string | null;
}

/**
 * GET /admin/managers — paginated, searchable by manager name/email/display name.
 *
 * `associate_pros` on each row is a FIVE-member preview, not the roster; the BE
 * caps it to keep the list query cheap. Use `roster_size` for counts and the
 * detail route when the full roster is needed.
 */
export const useAssociateManagers = (params?: UseAssociateManagersParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_MANAGER_LIST_LIMIT;
  const q = params?.q ?? null;

  return useQuery({
    queryKey: managerKeys.list({ page, limit, q }),
    queryFn: () =>
      apiGetPaged('/admin/managers', ManagerListItemSchema, {
        params: { page, limit, ...(q ? { q } : {}) },
      }),
  });
};

/**
 * GET /admin/managers/:manager_id — the manager plus their FULL roster.
 *
 * `managerId` is the admin id (`ManagerListItem.manager_id`), not the
 * AssociateManager document's `id`.
 */
export const useAssociateManager = (managerId: string | null | undefined) =>
  useQuery({
    queryKey: managerKeys.detail(managerId ?? ''),
    queryFn: () => apiGet(`/admin/managers/${managerId}`, ManagerListItemSchema),
    enabled: !!managerId,
  });
