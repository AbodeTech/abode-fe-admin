'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { WalletStatsSchema } from '../schemas/withdrawal.schema';

/**
 * GET /admin/wallets/stats — a live sum across every wallet.
 *
 * Takes no filters at all, so it is cached on its own key rather than beside
 * the queue stats. Duplicated in `features/asset-transactions` for the document
 * ledger's copy of this card: features stay self-contained, and there is no
 * `features/wallets` for the two to share. Fold them together if one appears.
 */
export const useWalletStats = () =>
  useQuery({
    queryKey: ['wallet-stats'] as const,
    queryFn: () => apiGet('/admin/wallets/stats', WalletStatsSchema),
    retry: false,
    staleTime: 60 * 1000,
  });
