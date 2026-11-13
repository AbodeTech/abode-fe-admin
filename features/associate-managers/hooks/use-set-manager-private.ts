'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';

import { ManagerListItemSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * PATCH /admin/managers/:manager_id/private — a private manager keeps a
 * hand-picked roster: auto-assign never gives them new Associate Pros, though
 * admins can still assign to them by hand. Their roster is not touched.
 */
export const useSetManagerPrivate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ managerId, isPrivate }: { managerId: string; isPrivate: boolean }) =>
      apiPatch(`/admin/managers/${managerId}/private`, { is_private: isPrivate }, ManagerListItemSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
  });
};
