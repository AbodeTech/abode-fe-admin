'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete } from '@/lib/api-client';

import { RemoveManagerResultSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * DELETE /admin/managers/:manager_id — retire a manager.
 *
 * The roster must be EMPTY. A manager who still holds pros gets a 400 whose
 * `details.pros_to_reassign` lists exactly who has to be moved first — see
 * `ManagerHasRosterDetailsSchema`. Reassign, then retry.
 */
export const useRemoveManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (managerId: string) =>
      apiDelete(`/admin/managers/${managerId}`, RemoveManagerResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
  });
};
