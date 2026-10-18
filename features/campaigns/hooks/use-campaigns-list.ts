import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { CampaignSchema, type CampaignStatus } from '../schemas/campaign.schema';
import { campaignKeys, DEFAULT_CAMPAIGNS_LIMIT, type CampaignListFilters } from './query-keys';

export const useCampaignsList = (filters?: CampaignListFilters) => {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_CAMPAIGNS_LIMIT;
  const status = filters?.status ?? undefined;
  const search = filters?.search || undefined;

  return useQuery({
    queryKey: campaignKeys.list({ status: status ?? null, search: search ?? null, page, limit }),
    queryFn: async () => {
      const result = await apiGetPaged('/admin/campaigns', CampaignSchema, {
        params: {
          page,
          limit,
          status: status || undefined,
          search: search || undefined,
        },
      });
      return { data: result.items, meta: result.meta };
    },
  });
};

export type { CampaignStatus };
