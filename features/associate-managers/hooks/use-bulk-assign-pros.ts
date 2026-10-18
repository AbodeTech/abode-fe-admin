'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { BulkAssignResultSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * POST /admin/managers/:manager_id/pros — put pros on a roster.
 *
 * Transactional and idempotent: a pro already on the target roster is accepted
 * as a no-op, and pros held by other managers are pulled across. The BE caps a
 * single call at 200 ids (`BULK_ASSIGN_MAX`) — chunk above that.
 */
export const useBulkAssignPros = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ managerId, proIds }: { managerId: string; proIds: string[] }) =>
      apiPost(`/admin/managers/${managerId}/pros`, { pro_ids: proIds }, BulkAssignResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
  });
};
