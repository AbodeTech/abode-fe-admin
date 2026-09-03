import type { CampaignStatus } from '../schemas/campaign.schema';
import type { RewardRole } from '../schemas/reward.schema';

export const DEFAULT_CAMPAIGNS_LIMIT = 20;
export const DEFAULT_REWARDS_LIMIT = 20;

export type CampaignListFilters = {
  status?: CampaignStatus | null;
  search?: string | null;
  page?: number;
  limit?: number;
};

export type CampaignRewardFilters = {
  search?: string | null;
  role?: RewardRole | null;
  is_active?: boolean | null;
  page?: number;
  limit?: number;
};

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params?: CampaignListFilters) => [...campaignKeys.lists(), params ?? {}] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  dashboards: () => [...campaignKeys.all, 'dashboard'] as const,
  dashboard: (id: string) => [...campaignKeys.dashboards(), id] as const,
  rewards: (id: string, params?: CampaignRewardFilters) =>
    [...campaignKeys.all, 'rewards', id, params ?? {}] as const,
};
