'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPut } from '@/lib/api-client';

import {
  ManagerTargetSchema,
  type AssignTargetPayload,
} from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * PUT /admin/managers/:manager_id/targets/:year/:month — set or replace.
 *
 * The month and year are PATH segments, not body fields: the BE runs with
 * `forbidNonWhitelisted`, so an unexpected key is a hard 400 rather than an
 * ignored one.
 *
 * Every target is optional and an omitted one is LEFT ALONE, not reset — so a
 * partial save is a real partial save. Send a number only for the fields the
 * admin actually filled in; see `AssignTargetPayload`.
 */
export const useAssignManagerTarget = () => {
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
        `/admin/managers/${managerId}/targets/${year}/${month}`,
        values,
        ManagerTargetSchema
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: managerKeys.targetsAll(variables.managerId) });
      queryClient.invalidateQueries({ queryKey: managerKeys.dashboards() });
    },
  });
};
