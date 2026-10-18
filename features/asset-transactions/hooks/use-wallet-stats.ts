'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { WalletStatsSchema } from '../schemas/purchase.schema';

/**
 * GET /admin/wallets/stats — a live sum across every wallet, for the document
 * ledger's balance card. See the schema for why this is duplicated rather than
 * shared with `features/withdrawals`.
 */
export const useWalletStats = () =>
  useQuery({
    queryKey: ['wallet-stats'] as const,
    queryFn: () => apiGet('/admin/wallets/stats', WalletStatsSchema),
    retry: false,
    staleTime: 60 * 1000,
  });
