import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CampaignSchema } from '../schemas/campaign.schema';
import { campaignKeys } from './query-keys';

export const useCampaignDetail = (id: string | undefined) =>
  useQuery({
    queryKey: campaignKeys.detail(id ?? ''),
    queryFn: () => apiGet(`/admin/campaigns/${id}`, CampaignSchema),
    enabled: Boolean(id),
  });
