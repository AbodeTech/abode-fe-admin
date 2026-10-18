'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';

import {
  MessageAckSchema,
} from '../schemas/user-actions.schema';
import {
  PlanMutationResultSchema,
  PlanCreationAssetSchema,
  type AdminAdjustPlanBalancePayload,
  type AdminCloseAndRelocatePayload,
  type AdminClosePlanPayload,
  type AdminCreateDeveloperPlanPayload,
  type AdminCreateFlexPlanPayload,
  type AdminCreateOwnershipPlanPayload,
  type AdminDeletePlanPayload,
  type AdminEditAssetQuestionPayload,
  type AdminEditPlanCommissionConfigPayload,
  type AdminEditPlanCommissionRecipientsPayload,
  type AdminOverridePaymentDatePayload,
  type AdminPlanEmailPayload,
  type AdminUpdatePlanSpecPayload,
  type PlanMutationReason,
} from '../schemas/user-plan-actions.schema';
import { userKeys } from './query-keys';

type PlanTarget<T> = { userId: string; planId: string; payload: T };
type CreateTarget<T> = { userId: string; payload: T };

export function useUserPlanCreationAssets(enabled = true) {
  return useQuery({
    queryKey: [...userKeys.all, 'plan-creation-assets'],
    queryFn: () =>
      apiGetPaged('/admin/assets', PlanCreationAssetSchema, {
        params: { page: 1, limit: 100 },
      }),
    enabled,
  });
}

function invalidatePlanQueries(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
  queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
}

function useCreatePlan<T>(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: CreateTarget<T>) =>
      apiPost(`/admin/users/${userId}/assets/${path}`, payload, PlanMutationResultSchema),
    onSuccess: (_result, { userId }) => invalidatePlanQueries(queryClient, userId),
  });
}

export const useCreateUserFlexPlan = () => useCreatePlan<AdminCreateFlexPlanPayload>('flex');
export const useCreateUserFullOwnershipPlan = () =>
  useCreatePlan<AdminCreateOwnershipPlanPayload>('full-ownership');
export const useCreateUserCommercialPlan = () =>
  useCreatePlan<AdminCreateOwnershipPlanPayload>('commercial');
export const useCreateUserDeveloperPlot = () =>
  useCreatePlan<AdminCreateDeveloperPlanPayload>('developer-plot');

export function useDeleteUserPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, planId, payload }: PlanTarget<AdminDeletePlanPayload>) =>
      apiDelete(`/admin/users/${userId}/assets/${planId}`, PlanMutationResultSchema, {
        body: payload,
      }),
    onSuccess: (_result, { userId }) => invalidatePlanQueries(queryClient, userId),
  });
}

function usePlanPost<T>(suffix: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, planId, payload }: PlanTarget<T>) =>
      apiPost(
        `/admin/users/${userId}/assets/${planId}/${suffix}`,
        payload,
        PlanMutationResultSchema,
      ),
    onSuccess: (_result, { userId }) => invalidatePlanQueries(queryClient, userId),
  });
}

function usePlanPatch<T>(suffix: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, planId, payload }: PlanTarget<T>) =>
      apiPatch(
        `/admin/users/${userId}/assets/${planId}/${suffix}`,
        payload,
        PlanMutationResultSchema,
      ),
    onSuccess: (_result, { userId }) => invalidatePlanQueries(queryClient, userId),
  });
}

export const useEditUserAssetQuestion = () =>
  usePlanPatch<AdminEditAssetQuestionPayload>('asset-question');
export const useAdjustUserPlanBalance = () =>
  usePlanPost<AdminAdjustPlanBalancePayload>('balance/adjust');
export const useOverrideUserPlanPaymentDate = () =>
  usePlanPatch<AdminOverridePaymentDatePayload>('next-payment-date');
export const useUpdateUserPlanSpec = () =>
  usePlanPatch<AdminUpdatePlanSpecPayload>('spec');
export const useSuspendUserPlan = () => usePlanPost<PlanMutationReason>('suspend');
export const useUnsuspendUserPlan = () => usePlanPost<PlanMutationReason>('unsuspend');
export const useCloseUserPlan = () => usePlanPost<AdminClosePlanPayload>('close');
export const useCloseAndRelocateUserPlan = () =>
  usePlanPost<AdminCloseAndRelocatePayload>('close-and-relocate');
export const useEditUserPlanCommissionConfig = () =>
  usePlanPatch<AdminEditPlanCommissionConfigPayload>('commission-config');
export const useEditUserPlanCommissionRecipients = () =>
  usePlanPatch<AdminEditPlanCommissionRecipientsPayload>('commission-recipients');

function usePlanEmail(path: string) {
  return useMutation({
    mutationFn: ({ userId, planId, payload }: PlanTarget<AdminPlanEmailPayload>) =>
      apiPost(`/admin/users/${userId}/assets/${planId}/emails/${path}`, payload, MessageAckSchema),
  });
}

export const useSendUserPlanContract = () => usePlanEmail('contract');
export const useSendUserPlanCompletionCertificate = () =>
  usePlanEmail('completion-certificate');
export const useSendUserPlanFlexTerms = () => usePlanEmail('flex-terms');
export const useSendUserPlanSignatureReminder = () => usePlanEmail('signature-reminder');
