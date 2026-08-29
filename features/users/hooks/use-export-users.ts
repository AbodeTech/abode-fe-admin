'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';
import { boolQuery, bothOrNeitherDates } from '../utils/admin-users-query';

export type ExportUsersParams = {
  search?: string;
  tier?: string;
  howYouHeard?: string;
  hasAsset?: boolean;
  hasReferral?: boolean;
  dateFrom?: string;
  dateTo?: string;
};

/**
 * GET /admin/users?export=csv — streamed CSV (not JSON-enveloped).
 * Same pattern as flex-leads: bypass apiGet, refuse in mock mode.
 */
export const useExportUsersByFilter = () =>
  useMutation({
    mutationFn: async (filters: ExportUsersParams) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const response = await apiClient.get('/admin/users', {
        params: {
          export: 'csv',
          search: filters.search?.trim() || undefined,
          tier: filters.tier || undefined,
          how_you_hear_about_us: filters.howYouHeard || undefined,
          has_asset: boolQuery(filters.hasAsset),
          has_referral: boolQuery(filters.hasReferral),
          ...bothOrNeitherDates(filters.dateFrom, filters.dateTo),
        },
        responseType: 'blob',
      });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'users.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });

/** Kept for the old modal's flex/FO branch — those filters are not on GET /admin/users. */
export const useExportUsersWithAsset = useExportUsersByFilter;
