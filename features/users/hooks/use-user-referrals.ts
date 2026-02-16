import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { userKeys } from './query-keys';

const GET_USER_REFERRALS_QUERY = graphql(`
  query ViewUserReferralsByAdmin($viewUserReferralsByAdminId: ID!) {
    viewUserReferralsByAdmin(id: $viewUserReferralsByAdminId) {
      _id
      commission
      createdAt
      userReferralStatus
      email
      name
      phoneNumber
      status
    }
  }
`);

const REMOVE_REFERRAL_BY_ADMIN_MUTATION = graphql(`
  mutation RemoveReferralByAdmin($referralUpdateInput: ReferralUpdateInput!) {
    removeReferralByAdmin(referralUpdateInput: $referralUpdateInput)
  }
`);

export const useUserReferrals = (userId: string) => {
  return useQuery({
    queryKey: userKeys.referrals(userId),
    queryFn: () =>
      execute(GET_USER_REFERRALS_QUERY, { viewUserReferralsByAdminId: userId }),
    select: (data) => data.viewUserReferralsByAdmin,
    enabled: !!userId,
  });
};

export const useDeleteUserReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, referralId }: { userId: string; referralId: string }) =>
      execute(REMOVE_REFERRAL_BY_ADMIN_MUTATION, { referralUpdateInput: { user_id: userId, referral_id: referralId } }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.referrals(userId) });
    },
  });
};

export type UserReferralData = NonNullable<ReturnType<typeof useUserReferrals>['data']>;

