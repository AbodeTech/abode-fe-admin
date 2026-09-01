import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CampaignDashboardSchema } from '../schemas/dashboard-response.schema';
import { campaignKeys } from './query-keys';

export const useCampaignDashboard = (id: string | undefined) =>
  useQuery({
    queryKey: campaignKeys.dashboard(id ?? ''),
    queryFn: () => apiGet(`/admin/campaigns/${id}/dashboard`, CampaignDashboardSchema),
    enabled: Boolean(id),
  });
