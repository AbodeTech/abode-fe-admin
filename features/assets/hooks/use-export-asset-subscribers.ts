'use client';

import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import { buildSubscribersParams, type AssetSubscribersFilters } from './use-asset-subscribers';

/**
 * GET /admin/assets/:id/subscribers/export — CSV stream, 23 columns.
 * `export_asset_subscribers` (separately permissioned from viewing: the file
 * is buyer PII) and throttled to **10 per hour**, so a 429 is a normal thing
 * for an admin to hit and gets its own message rather than a raw axios error.
 *
 * Streamed, not JSON-enveloped — same pattern as the users export: bypass
 * `apiGet`, refuse in mock mode rather than handing back a fabricated file.
 * `page`/`limit` are dropped because the export always covers the whole filter
 * set; the sort is kept so the file matches the table's order.
 */
export const useExportAssetSubscribers = (assetId: string) =>
  useMutation({
    mutationFn: async (filters: AssetSubscribersFilters = {}) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const params: Record<string, unknown> = buildSubscribersParams(filters);
      // The export always covers the whole filter set; sending these is noise.
      delete params.page;
      delete params.limit;

      try {
        const response = await apiClient.get(`/admin/assets/${assetId}/subscribers/export`, {
          params,
          responseType: 'blob',
        });

        const disposition = String(response.headers['content-disposition'] ?? '');
        const filename =
          /filename="([^"]+)"/.exec(disposition)?.[1] ?? `asset-${assetId}-subscribers.csv`;

        const url = URL.createObjectURL(response.data as Blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);

        return { filename };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          throw new Error(
            'Subscriber exports are limited to 10 per hour. Try again a little later.'
          );
        }
        throw error;
      }
    },
  });
