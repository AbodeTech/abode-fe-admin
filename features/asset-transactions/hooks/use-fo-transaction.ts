'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, isClientError } from '@/lib/api-client';

import { FoTransactionDetailSchema } from '../schemas/purchase.schema';
import { purchaseKeys } from './query-keys';

/**
 * GET /admin/fo/purchase/transactions/:id — one full-ownership purchase, with
 * the outright document sibling when this is the land row.
 */
export const useFoTransaction = (txId: string) =>
  useQuery({
    queryKey: purchaseKeys.detail(txId),
    queryFn: () => apiGet(`/admin/fo/purchase/transactions/${txId}`, FoTransactionDetailSchema),
    enabled: Boolean(txId),
    retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
  });
