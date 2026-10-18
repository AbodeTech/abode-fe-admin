import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { CampaignSchema } from '../schemas/campaign.schema';
import type { CreateCampaignDto } from '../schemas/create-campaign.schema';
import { toCreateCampaignBody } from '../utils/campaign-payload';
import { campaignKeys } from './query-keys';

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampaignDto) =>
      apiPost('/admin/campaigns', toCreateCampaignBody(payload), CampaignSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
};
