'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import type { PlanFilterKey, PlanSortKey } from '../schemas/cs-manager.schema';

/**
 * GET /admin/cs-managers/:manager_id/exports/plans — @SkipTransform,
 * streamed CSV. Same pattern as flex-leads/purchase-confirmations: bypasses
 * apiGet's envelope handling, refuses cleanly in mock mode.
 */
export const useExportDashboardPlans = () =>
  useMutation({
    mutationFn: async (params: {
      managerId: string;
      month?: number;
      year?: number;
      filter?: PlanFilterKey;
      search?: string;
      sort?: PlanSortKey;
    }) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const { managerId, ...query } = params;
      const response = await apiClient.get(`/admin/cs-managers/${managerId}/exports/plans`, {
        params: { ...query, search: query.search || undefined },
        responseType: 'blob',
      });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'cs-manager-plans.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
