import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks';

import { transactionKeys } from './query-keys';

/* ============================================================
 * GET /admin/commission/transactions/export
 *
 * Streaming CSV (`@SkipTransform` / direct `@Res()`), so this bypasses
 * `apiGet` and uses the raw axios client with `responseType: 'blob'`.
 * The BE refuses sets above 50k rows before streaming.
 *
 * Query mirrors CommissionTransactionQueryDto: from, to, source_type, q, …
 * ============================================================ */

const COMMISSION_SOURCE_TYPES = new Set([
  'direct',
  'upline',
  'topline',
  'agency',
  'founder',
  'wht',
]);

export type CommissionExportParams = {
  from?: string | null;
  to?: string | null;
  /** Prefer BE `source_type` (direct/upline/…). Legacy page filter may pass flex/FO. */
  source_type?: string | null;
  q?: string | null;
  referrer_id?: string | null;
  source_user?: string | null;
  source_asset?: string | null;
  override_source?: string | null;
  tier_at_creation?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  sort_by?: 'createdAt' | 'net_commission' | 'gross_commission' | null;
  sort_dir?: 'asc' | 'desc' | null;
};

async function readBlobError(blob: Blob): Promise<string | null> {
  if (!blob.type.includes('json') && blob.type.includes('csv')) return null;
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text) as { message?: unknown; error?: string };
    if (typeof parsed.message === 'string') return parsed.message;
    if (Array.isArray(parsed.message)) return parsed.message.filter(Boolean).join('; ');
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    /* not JSON — treat as a successful file */
  }
  return null;
}

export const useCommissionExport = () =>
  useMutation({
    mutationKey: [...transactionKeys.all, 'commission-export'],
    mutationFn: async (params: CommissionExportParams) => {
      if (isMockApiEnabled()) {
        throw new Error(
          'Export is unavailable in mock mode — point the app at a real backend.'
        );
      }

      const sourceType =
        params.source_type && COMMISSION_SOURCE_TYPES.has(params.source_type)
          ? params.source_type
          : undefined;

      const response = await apiClient.get('/admin/commission/transactions/export', {
        params: {
          from: params.from || undefined,
          to: params.to || undefined,
          source_type: sourceType,
          q: params.q || undefined,
          referrer_id: params.referrer_id || undefined,
          source_user: params.source_user || undefined,
          source_asset: params.source_asset || undefined,
          override_source: params.override_source || undefined,
          tier_at_creation: params.tier_at_creation || undefined,
          min_amount: params.min_amount ?? undefined,
          max_amount: params.max_amount ?? undefined,
          sort_by: params.sort_by || undefined,
          sort_dir: params.sort_dir || undefined,
        },
        responseType: 'blob',
      });

      const blob = response.data as Blob;
      const errorMessage = await readBlobError(blob);
      if (errorMessage) throw new Error(errorMessage);

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename =
        /filename="([^"]+)"/.exec(disposition)?.[1] ??
        `commission-transactions-${new Date().toISOString().split('T')[0]}.csv`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
