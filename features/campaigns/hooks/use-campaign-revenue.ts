import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CampaignRevenueSchema } from '../schemas/revenue.schema';
import { campaignKeys } from './query-keys';

/** Needs view_sales as well as view_campaigns — pass `enabled: false` without it, or the BE 403s. */
export const useCampaignRevenue = (id: string | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: campaignKeys.revenue(id ?? ''),
    queryFn: () => apiGet(`/admin/campaigns/${id}/revenue`, CampaignRevenueSchema),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
