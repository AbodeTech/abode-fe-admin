'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import type { RecoveryFilterKey } from '../schemas/financial-officer.schema';

/**
 * GET /admin/financial-officers/:officer_id/exports/recovery-plans — streamed
 * CSV, bypasses apiGet's envelope. Same pattern as the CS Manager export:
 * refuses cleanly in mock mode.
 */
export const useExportRecoveryPlans = () =>
  useMutation({
    mutationFn: async (params: {
      officerId: string;
      month?: number;
      year?: number;
      filter?: RecoveryFilterKey;
      search?: string;
    }) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const { officerId, ...query } = params;
      const response = await apiClient.get(
        `/admin/financial-officers/${officerId}/exports/recovery-plans`,
        { params: { ...query, search: query.search || undefined }, responseType: 'blob' }
      );

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'recovery-plans.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
