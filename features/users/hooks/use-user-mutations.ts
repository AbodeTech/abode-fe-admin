import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { userKeys } from './query-keys';
import type {
  UserDetailsInput,
  AdminWalletInput,
  ModifyReferralInput,
  AdminWalletCommissionInput,
  UpdateUserTinInput,
  ClearUserTinInput,
} from '@/lib/gql/graphql';

const EDIT_USER_PROFILE_MUTATION = graphql(`
  mutation EditUserDetailsByAdmin($userDetailsInput: UserDetailsInput!) {
    editUserDetailsByAdmin(userDetailsInput: $userDetailsInput)
  }
`);

const EDIT_USER_WALLET_MUTATION = graphql(`
  mutation EditUserWalletDetailsByAdmin($adminWalletInput: AdminWalletInput!) {
    editUserWalletDetailsByAdmin(adminWalletInput: $adminWalletInput)
  }
`);

const MODIFY_REFERRAL_STATUS_MUTATION = graphql(`
  mutation ModifyUserReferralStatus($modifyReferralInput: ModifyReferralInput!) {
    modifyUserReferralStatus(modifyReferralInput: $modifyReferralInput)
  }
`);

const EDIT_WALLET_COMMISSION_MUTATION = graphql(`
  mutation EditWalletCommission($adminWalletCommissionInput: AdminWalletCommissionInput!) {
    editWalletCommission(adminWalletCommissionInput: $adminWalletCommissionInput)
  }
`);

const UPDATE_USER_TIN_MUTATION = graphql(`
  mutation UpdateUserTin($updateUserTinInput: UpdateUserTinInput!) {
    updateUserTin(updateUserTinInput: $updateUserTinInput) {
      success
      message
    }
  }
`);

const CLEAR_USER_TIN_MUTATION = graphql(`
  mutation ClearUserTin($clearUserTinInput: ClearUserTinInput!) {
    clearUserTin(clearUserTinInput: $clearUserTinInput) {
      success
      message
    }
  }
`);

const SUSPEND_USER_MUTATION = graphql(`
  mutation SuspendUser($id: ID!) {
    suspendUser(id: $id)
  }
`);

const UNSUSPEND_USER_MUTATION = graphql(`
  mutation UnsuspendUser($id: ID!) {
    unsuspendUser(id: $id)
  }
`);

export const useEditUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UserDetailsInput) =>
      execute(EDIT_USER_PROFILE_MUTATION, { userDetailsInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
};

export const useEditUserWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminWalletInput) =>
      execute(EDIT_USER_WALLET_MUTATION, { adminWalletInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
};

export const useModifyReferralStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ModifyReferralInput) =>
      execute(MODIFY_REFERRAL_STATUS_MUTATION, { modifyReferralInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
};

export const useEditWalletCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminWalletCommissionInput) =>
      execute(EDIT_WALLET_COMMISSION_MUTATION, { adminWalletCommissionInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
};

export const useUpdateUserTin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserTinInput) =>
      execute(UPDATE_USER_TIN_MUTATION, { updateUserTinInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
};

export const useClearUserTin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClearUserTinInput) =>
      execute(CLEAR_USER_TIN_MUTATION, { clearUserTinInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => execute(SUSPEND_USER_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended' }) });
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended-payment-plans' }) });
    },
  });
};

export const useUnsuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => execute(UNSUSPEND_USER_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended' }) });
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended-payment-plans' }) });
    },
  });
};
