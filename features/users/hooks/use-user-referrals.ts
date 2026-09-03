import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { apiGetPaged } from '@/lib/api-client';

import { AdminUserDetailRowSchema } from '../schemas/user-detail.schema';
import { toUserReferral } from '../lib/map-user-detail';
import { userKeys } from './query-keys';

const REMOVE_REFERRAL_BY_ADMIN_MUTATION = graphql(`
  mutation RemoveReferralByAdmin($referralUpdateInput: ReferralUpdateInput!) {
    removeReferralByAdmin(referralUpdateInput: $referralUpdateInput)
  }
`);

export const useUserReferrals = (userId: string) => {
  return useQuery({
    queryKey: userKeys.referrals(userId),
    queryFn: async () => {
      const { items } = await apiGetPaged(
        `/admin/users/${userId}/referrals`,
        AdminUserDetailRowSchema,
        { params: { page: 1, limit: 100 } }
      );
      return items.map(toUserReferral);
    },
    enabled: !!userId,
  });
};

export const useDeleteUserReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, referralId }: { userId: string; referralId: string }) =>
      execute(REMOVE_REFERRAL_BY_ADMIN_MUTATION, {
        referralUpdateInput: { user_id: userId, referral_id: referralId },
      }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.referrals(userId) });
    },
  });
};

export type UserReferralData = NonNullable<ReturnType<typeof useUserReferrals>['data']>;
