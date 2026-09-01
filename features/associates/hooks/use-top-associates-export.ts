'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import type { TopAssociateFilters } from '../schemas/top-associate.schema';

/**
 * GET /admin/associates/top/export — streaming CSV of the whole filtered
 * leaderboard, not just the page on screen.
 *
 * @SkipTransform on the BE, so this bypasses apiGet's envelope handling. The
 * row count is checked before a cursor opens, so an over-cap filter fails as
 * clean JSON (`EXPORT_TOO_LARGE`) rather than half a file. Throttled to
 * 10/hour, and gated on `export_associates_leaderboard` — a different
 * permission from the one that lets you read the list.
 */
export const useTopAssociatesExport = () =>
  useMutation({
    mutationFn: async (filters: TopAssociateFilters = {}) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const response = await apiClient.get('/admin/associates/top/export', {
        params: {
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          asset_type: filters.asset_type,
          referral_status: filters.referral_status,
          sort_by: filters.sort_by,
          sort_dir: filters.sort_dir,
          ...(filters.include_suspended ? { include_suspended: true } : {}),
        },
        responseType: 'blob',
      });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'top-associates.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
