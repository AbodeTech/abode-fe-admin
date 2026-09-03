import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { CampaignSchema, type CampaignStatus } from '../schemas/campaign.schema';
import { campaignKeys } from './query-keys';

export const useTransitionCampaign = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { status: CampaignStatus }) =>
      apiPost(`/admin/campaigns/${id}/transition`, payload, CampaignSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.dashboard(id) });
    },
  });
};
