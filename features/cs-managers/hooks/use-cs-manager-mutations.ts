'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPost, apiPut } from '@/lib/api-client';

import {
  AssignCustomersResultSchema,
  CSManagerAssignmentSchema,
  CSManagerTargetSchema,
  type AssignTargetPayload,
} from '../schemas/cs-manager.schema';
import { csManagerKeys } from './query-keys';

/** POST /admin/cs-managers — [Super admin] promote an admin. */
export const useAddCSManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adminId: string) =>
      apiPost('/admin/cs-managers', { admin_id: adminId }, CSManagerAssignmentSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csManagerKeys.list() });
    },
  });
};

/** DELETE /admin/cs-managers/:manager_id — [Super admin] demote. */
export const useRemoveCSManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (managerId: string) =>
      apiDelete(`/admin/cs-managers/${managerId}`, CSManagerAssignmentSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csManagerKeys.list() });
      queryClient.invalidateQueries({ queryKey: csManagerKeys.all });
    },
  });
};

/** POST /admin/cs-managers/:manager_id/assign-customers — bulk, transactional on the BE. */
export const useAssignCustomersToCSM = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ managerId, customerIds }: { managerId: string; customerIds: string[] }) =>
      apiPost(
        `/admin/cs-managers/${managerId}/assign-customers`,
        { customer_ids: customerIds },
        AssignCustomersResultSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csManagerKeys.list() });
      queryClient.invalidateQueries({ queryKey: csManagerKeys.all });
    },
  });
};

/** PUT /admin/cs-managers/:manager_id/targets/:year/:month — all three fields required. */
export const useUpsertCSManagerTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      managerId,
      year,
      month,
      values,
    }: {
      managerId: string;
      year: number;
      month: number;
      values: AssignTargetPayload;
    }) =>
      apiPut(
        `/admin/cs-managers/${managerId}/targets/${year}/${month}`,
        values,
        CSManagerTargetSchema
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: csManagerKeys.targets(variables.managerId) });
      queryClient.invalidateQueries({
        queryKey: csManagerKeys.target(variables.managerId, variables.year, variables.month),
      });
    },
  });
};
