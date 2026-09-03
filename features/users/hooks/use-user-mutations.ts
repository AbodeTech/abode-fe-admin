import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import type { AdminWalletCommissionInput } from '@/lib/gql/graphql';

import { userKeys } from './query-keys';
import type {
  AddReferralPayload,
  AdminReasonInput,
  AdminUserProfilePayload,
  AdminWalletAdjustPayload,
  ChangeTierPayload,
  ReassignReferrerPayload,
  SetUserTinPayload,
  SuspendUserPayload,
} from '../schemas/user-actions.schema';
import {
  AddReferralResultSchema,
  ChangeTierResultSchema,
  MessageAckSchema,
  ReassignReferrerResultSchema,
  WalletAdjustResultSchema,
} from '../schemas/user-actions.schema';

const EDIT_WALLET_COMMISSION_MUTATION = graphql(`
  mutation EditWalletCommission($adminWalletCommissionInput: AdminWalletCommissionInput!) {
    editWalletCommission(adminWalletCommissionInput: $adminWalletCommissionInput)
  }
`);

function invalidateUser(queryClient: ReturnType<typeof useQueryClient>, userId?: string) {
  queryClient.invalidateQueries({ queryKey: userKeys.lists() });
  queryClient.invalidateQueries({ queryKey: userKeys.details() });
  if (userId) {
    queryClient.invalidateQueries({ queryKey: userKeys.referrals(userId) });
  }
}

export const useEditUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminUserProfilePayload }) =>
      apiPatch(`/admin/users/${userId}/profile`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useEditUserWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminWalletAdjustPayload }) =>
      apiPost(`/admin/users/${userId}/wallet/adjust`, payload, WalletAdjustResultSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useModifyReferralStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ChangeTierPayload }) =>
      apiPatch(`/admin/users/${userId}/tier`, payload, ChangeTierResultSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useReassignReferrer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ReassignReferrerPayload }) =>
      apiPatch(`/admin/users/${userId}/referrer`, payload, ReassignReferrerResultSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useAddUserReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AddReferralPayload }) =>
      apiPost(`/admin/users/${userId}/referrals`, payload, AddReferralResultSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useDeleteUserReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      referralId,
      payload,
    }: {
      userId: string;
      referralId: string;
      payload: AdminReasonInput;
    }) =>
      apiDelete(`/admin/users/${userId}/referrals/${referralId}`, MessageAckSchema, {
        body: payload,
      }),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useEditWalletCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminWalletCommissionInput) =>
      execute(EDIT_WALLET_COMMISSION_MUTATION, { adminWalletCommissionInput: input }),
    onSuccess: () => invalidateUser(queryClient),
  });
};

export const useUpdateUserTin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: SetUserTinPayload }) =>
      apiPatch(`/admin/users/${userId}/kyc/tin`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useClearUserTin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminReasonInput }) =>
      apiDelete(`/admin/users/${userId}/kyc/tin`, MessageAckSchema, { body: payload }),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: SuspendUserPayload }) =>
      apiPost(`/admin/users/${userId}/suspend`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => {
      invalidateUser(queryClient, userId);
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended' }) });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });
};

export const useUnsuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminReasonInput }) =>
      apiPost(`/admin/users/${userId}/unsuspend`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => {
      invalidateUser(queryClient, userId);
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended' }) });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });
};

export const useForcePasswordReset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminReasonInput }) =>
      apiPost(`/admin/users/${userId}/force-password-reset`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useSuspendWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminReasonInput }) =>
      apiPost(`/admin/users/${userId}/wallet/suspend`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};

export const useUnsuspendWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminReasonInput }) =>
      apiPost(`/admin/users/${userId}/wallet/unsuspend`, payload, MessageAckSchema),
    onSuccess: (_data, { userId }) => invalidateUser(queryClient, userId),
  });
};
