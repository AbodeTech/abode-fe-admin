import { useQuery } from '@tanstack/react-query';
import { apiGetPaged } from '@/lib/api-client';

import { AdminUserDetailRowSchema } from '../schemas/user-detail.schema';
import { toUserReferral } from '../lib/map-user-detail';
import { userKeys } from './query-keys';

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

export type UserReferralData = NonNullable<ReturnType<typeof useUserReferrals>['data']>;
