import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { userKeys } from './query-keys';
import type { UserDetailsInput, AdminWalletInput, ModifyReferralInput } from '@/lib/gql/graphql';

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

export const useEditUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UserDetailsInput) =>
      execute(EDIT_USER_PROFILE_MUTATION, { userDetailsInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
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
    },
  });
};
