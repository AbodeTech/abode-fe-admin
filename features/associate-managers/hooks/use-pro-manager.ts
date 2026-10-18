'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { ManagerListItemSchema, type ManagerListItem } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * Resolve which associate manager currently holds this pro.
 *
 * There is no `GET /admin/managers/pros/:pro_id` route — assignment lives on
 * each manager's roster. The list endpoint only previews five pros, so we
 * check the preview first, then fetch full detail for any manager whose
 * roster is larger than the preview.
 */
export function useProManager(proId: string | null | undefined) {
  return useQuery({
    queryKey: managerKeys.proManager(proId ?? ''),
    enabled: !!proId,
    queryFn: async (): Promise<ManagerListItem | null> => {
      const { items: managers } = await apiGetPaged('/admin/managers', ManagerListItemSchema, {
        params: { page: 1, limit: 100 },
      });

      for (const manager of managers) {
        if (manager.associate_pros.some((pro) => pro.pro_id === proId)) {
          return manager;
        }
      }

      const needsFullRoster = managers.filter(
        (manager) => manager.roster_size > manager.associate_pros.length
      );

      const details = await Promise.all(
        needsFullRoster.map((manager) =>
          apiGet(`/admin/managers/${manager.manager_id}`, ManagerListItemSchema)
        )
      );

      return details.find((manager) =>
        manager.associate_pros.some((pro) => pro.pro_id === proId)
      ) ?? null;
    },
  });
}
