'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CommissionPreviewSchema } from '../schemas/commission.schema';
import { commissionKeys } from './query-keys';
import type { OfferType } from '../schemas/commission.schema';

/**
 * GET /admin/commission/preview — the dry-run (ticket 9b, live 2026-07-28).
 *
 * Resolves the same asset_user → user → asset → default chain a real purchase
 * would, server-side. The frontend never reimplements that chain — the whole
 * point of this endpoint is that the rules live in exactly one place.
 *
 * All three params are required by `PreviewCommissionDto`; the query stays
 * disabled until the caller has them.
 */
export const useCommissionPreview = (params: {
  userId: string;
  assetId: string;
  offerType: OfferType | '';
}) =>
  useQuery({
    queryKey: commissionKeys.preview(params),
    queryFn: () =>
      apiGet('/admin/commission/preview', CommissionPreviewSchema, {
        params: {
          user_id: params.userId,
          asset_id: params.assetId,
          offer_type: params.offerType,
        },
      }),
    enabled: Boolean(params.userId && params.assetId && params.offerType),
  });
