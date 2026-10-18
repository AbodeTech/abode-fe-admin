import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';

import { CampaignSchema } from '../schemas/campaign.schema';
import type { CreateCampaignDto, LimitedCampaignEditDto } from '../schemas/create-campaign.schema';
import { toUpdateCampaignBody } from '../utils/campaign-payload';
import { campaignKeys } from './query-keys';

export const useUpdateCampaign = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<CreateCampaignDto> | LimitedCampaignEditDto) =>
      apiPatch(`/admin/campaigns/${id}`, toUpdateCampaignBody(payload), CampaignSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.dashboard(id) });
    },
  });
};
