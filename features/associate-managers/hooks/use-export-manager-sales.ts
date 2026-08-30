'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

/**
 * GET /admin/managers/:manager_id/exports/sales-record — a streaming CSV of
 * every sale made by the manager's roster.
 *
 * Streamed, so the row cap is discovered mid-flight: the BE attaches the CSV
 * headers on the FIRST write, which is what lets an over-cap request fail as
 * clean JSON instead of downloading an error labelled `text/csv`.
 *
 * Buyer PII is deliberately EXCLUDED — `export_manager_tracker` is the
 * manager-tracker grant, not the Sales module's full-export permission.
 *
 * Throttled to 10/hour per admin.
 */
export const useExportManagerSalesRecord = () =>
  useMutation({
    mutationFn: async ({
      managerId,
      params,
    }: {
      managerId: string;
      /** Sales filters — the same `SalesQueryDto` the sales table sends. */
      params?: Record<string, unknown>;
    }) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const response = await apiClient.get(
        `/admin/managers/${managerId}/exports/sales-record`,
        { params: params ?? {}, responseType: 'blob' }
      );

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'manager-sales-record.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
