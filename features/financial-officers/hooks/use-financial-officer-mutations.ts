'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPost, apiPut } from '@/lib/api-client';

import {
  FinancialOfficerAssignmentSchema,
  FinancialOfficerTargetSchema,
  RecoveryPlanDetailSchema,
  type AssignFinancialOfficerTargetPayload,
} from '../schemas/financial-officer.schema';
import { financialOfficerKeys } from './query-keys';

/** POST /admin/financial-officers — [Super admin] promote an admin. */
export const useAddFinancialOfficer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adminId: string) =>
      apiPost('/admin/financial-officers', { admin_id: adminId }, FinancialOfficerAssignmentSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialOfficerKeys.all });
    },
  });
};

/**
 * DELETE /admin/financial-officers/:officer_id — [Super admin] demote. The BE
 * redistributes their open recovery plans to the remaining officers, the same
 * fewest-open-plans rule that assigns new ones.
 */
export const useRemoveFinancialOfficer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (officerId: string) =>
      apiDelete(`/admin/financial-officers/${officerId}`, FinancialOfficerAssignmentSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialOfficerKeys.all });
    },
  });
};

/** PUT /admin/financial-officers/:officer_id/targets/:year/:month */
export const useUpsertFinancialOfficerTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      officerId,
      year,
      month,
      values,
    }: {
      officerId: string;
      year: number;
      month: number;
      values: AssignFinancialOfficerTargetPayload;
    }) =>
      apiPut(
        `/admin/financial-officers/${officerId}/targets/${year}/${month}`,
        values,
        FinancialOfficerTargetSchema
      ),
    onSuccess: (_data, { officerId }) => {
      queryClient.invalidateQueries({ queryKey: financialOfficerKeys.targets(officerId) });
      // The score and the recovery tile both read the target.
      queryClient.invalidateQueries({ queryKey: financialOfficerKeys.dashboards() });
      queryClient.invalidateQueries({ queryKey: financialOfficerKeys.list() });
    },
  });
};

/** POST /admin/financial-officers/recovery-plans/:plan_id/reassign — [Super admin]. */
export const useReassignRecoveryPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, officerId }: { planId: string; officerId: string }) =>
      apiPost(
        `/admin/financial-officers/recovery-plans/${planId}/reassign`,
        { officer_id: officerId },
        RecoveryPlanDetailSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialOfficerKeys.all });
    },
  });
};
