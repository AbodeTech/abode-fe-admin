'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { MarketplaceStatsSchema } from '../schemas/marketplace.schema';
import { marketplaceKeys } from './query-keys';

/** GET /admin/marketplace/stats — status breakdown + completed-sale totals, verified live 2026-08-20. */
export const useMarketplaceStats = () =>
  useQuery({
    queryKey: marketplaceKeys.stats(),
    queryFn: () => apiGet('/admin/marketplace/stats', MarketplaceStatsSchema),
  });
