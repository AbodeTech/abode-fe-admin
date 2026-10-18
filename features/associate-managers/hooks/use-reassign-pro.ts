'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { ManagerListItemSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * POST /admin/managers/pros/:pro_id/reassign — move one pro to another manager.
 *
 * Answers with the TARGET manager's refreshed row. Moving a pro to the manager
 * who already holds them is a no-op that sends no notification email.
 */
export const useReassignPro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ proId, toManagerId }: { proId: string; toManagerId: string }) =>
      apiPost(
        `/admin/managers/pros/${proId}/reassign`,
        { to_manager_id: toManagerId },
        ManagerListItemSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
  });
};
