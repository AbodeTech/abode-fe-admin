import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { CampaignRewardSchema } from '../schemas/reward.schema';
import type { InvalidateRewardDto } from '../schemas/invalidate-reward.schema';
import { campaignKeys } from './query-keys';

export const useInvalidateReward = (rewardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvalidateRewardDto) =>
      apiPost(`/admin/campaigns/rewards/${rewardId}/invalidate`, payload, CampaignRewardSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};
