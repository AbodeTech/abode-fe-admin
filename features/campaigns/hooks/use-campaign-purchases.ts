import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { CampaignPurchaseSchema } from '../schemas/purchase.schema';
import {
  campaignKeys,
  DEFAULT_PURCHASES_LIMIT,
  type CampaignPurchaseFilters,
} from './query-keys';

/** Needs view_sales as well as view_campaigns. */
export const useCampaignPurchases = (
  campaignId: string | undefined,
  filters?: CampaignPurchaseFilters,
  options?: { enabled?: boolean }
) => {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_PURCHASES_LIMIT;
  const search = filters?.search || undefined;
  const assetId = filters?.asset_id || undefined;

  return useQuery({
    queryKey: campaignKeys.purchases(campaignId ?? '', {
      search: search ?? null,
      asset_id: assetId ?? null,
      page,
      limit,
    }),
    enabled: Boolean(campaignId) && (options?.enabled ?? true),
    // Paging and searching keep the current rows up rather than flashing a skeleton.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await apiGetPaged(`/admin/campaigns/${campaignId}/purchases`, CampaignPurchaseSchema, {
        params: { page, limit, search, asset_id: assetId },
      });
      return { data: result.items, meta: result.meta };
    },
  });
};
