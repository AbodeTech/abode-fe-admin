'use client';

import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import { salesKeys } from './query-keys';
import { buildSalesListParams, type SalesListFilters } from './use-sales';

/**
 * The BE's own sales CSV, permission-gated rather than Super Admin only:
 *
 *   GET /admin/sales/export       `export_sales`      21 columns, no buyer PII
 *   GET /admin/sales/export/full  `export_sales_pii`  adds the buyer detail columns
 *
 * Streamed, BOM-prefixed and `@SkipTransform`, so this bypasses `apiGet` the same
 * way the allocation and flex-lead exports do. The BE caps a file at 50,000 rows
 * (`EXPORT_TOO_LARGE`, checked before any bytes stream), throttles to 10/hour
 * (3/hour for `/full`) and writes an audit log entry per download.
 *
 * Takes the same `SalesQueryDto` filters as the table, so the file matches what is
 * on screen. `page`/`limit` are not sent — the export ignores them.
 *
 * The custom column-picker export (`use-sales-export.ts`) stays Super Admin only:
 * it needs `/export/data`, which the BE restricts to Super Admin.
 */

/** With `responseType: 'blob'` the BE's JSON error body arrives as a Blob. */
const readBlobError = async (error: unknown): Promise<Error> => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Failed to export sales.');
  }

  const data: unknown = error.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as { message?: unknown; code?: unknown };
      const message = typeof body.message === 'string' ? body.message : error.message;
      return new Error(typeof body.code === 'string' ? `${body.code}: ${message}` : message);
    } catch {
      // Not JSON — fall through to the axios message.
    }
  }
  return new Error(error.message);
};

export const useSalesCsvExport = () =>
  useMutation({
    mutationKey: salesKeys.csvExport(),
    mutationFn: async ({ filters, withPii }: { filters: SalesListFilters; withPii: boolean }) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const params: Partial<ReturnType<typeof buildSalesListParams>> = buildSalesListParams(filters);
      delete params.page;
      delete params.limit;

      let response;
      try {
        response = await apiClient.get(withPii ? '/admin/sales/export/full' : '/admin/sales/export', {
          params,
          responseType: 'blob',
        });
      } catch (error) {
        throw await readBlobError(error);
      }

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'sales.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
