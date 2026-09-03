import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { CampaignRewardSchema } from '../schemas/reward.schema';
import { campaignKeys, DEFAULT_REWARDS_LIMIT, type CampaignRewardFilters } from './query-keys';

export const useCampaignRewards = (campaignId: string | undefined, filters?: CampaignRewardFilters) => {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_REWARDS_LIMIT;
  const search = filters?.search || undefined;
  const role = filters?.role ?? undefined;
  const isActive = filters?.is_active;

  return useQuery({
    queryKey: campaignKeys.rewards(campaignId ?? '', {
      search: search ?? null,
      role: role ?? null,
      is_active: isActive ?? null,
      page,
      limit,
    }),
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const result = await apiGetPaged(`/admin/campaigns/${campaignId}/rewards`, CampaignRewardSchema, {
        params: {
          page,
          limit,
          role: role || undefined,
          is_active: isActive === null || isActive === undefined ? undefined : isActive,
        },
      });
      return { data: result.items, meta: result.meta };
    },
  });
};
