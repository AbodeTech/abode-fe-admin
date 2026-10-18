'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

import { ApiClientError, apiClient } from '@/lib/api-client';
import { dispatchMockRequest, isMockApiEnabled } from '@/lib/mocks';

import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';
import { buildPaymentPlansQueryParams } from '../lib/url-state';
import { paymentPlansKeys } from './query-keys';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function toastExportCap(countLabel: string) {
  toast.error(
    `Export would include ${countLabel} rows; narrow your filter to under 50,000.`
  );
}

function countFromExportError(parsed: {
  message?: unknown;
  details?: { total?: unknown; matched_count?: unknown };
}): string | null {
  const matched = parsed.details?.matched_count;
  if (typeof matched === 'number') return String(matched);
  const total = parsed.details?.total;
  if (typeof total === 'number') return String(total);
  if (typeof parsed.message === 'string') {
    const match = parsed.message.match(/(\d[\d,]*)/);
    if (match) return match[1].replace(/,/g, '');
    return parsed.message;
  }
  return null;
}

async function messageFromBlob(data: unknown): Promise<string | null> {
  if (!(data instanceof Blob)) return typeof data === 'string' ? data : null;
  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as {
      message?: unknown;
      details?: { total?: unknown; matched_count?: unknown };
    };
    return countFromExportError(parsed);
  } catch {
    return null;
  }
}

export function useExportPaymentPlans() {
  return useMutation({
    mutationKey: paymentPlansKeys.export(),
    mutationFn: async (filter: FilterFormValues) => {
      const params = { ...buildPaymentPlansQueryParams(filter, 1, 1) };
      delete params.page;
      delete params.limit;

      if (isMockApiEnabled()) {
        const payload = await dispatchMockRequest({
          method: 'GET',
          path: '/admin/payment-plans/export',
          query: params,
          body: undefined,
        });
        const csv = typeof payload === 'string' ? payload : String(payload);
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'payment-plans.csv');
        return { filename: 'payment-plans.csv' };
      }

      try {
        const response = await apiClient.get('/admin/payment-plans/export', {
          params,
          responseType: 'blob',
        });
        const disposition = String(response.headers['content-disposition'] ?? '');
        const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'payment-plans.csv';
        downloadBlob(response.data as Blob, filename);
        return { filename };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 413) {
          const n = (await messageFromBlob(err.response.data)) ?? 'N';
          toastExportCap(n);
          throw new ApiClientError({
            messages: [`Export would include ${n} rows; narrow your filter to under 50,000.`],
            statusCode: 413,
            method: 'GET',
            path: '/admin/payment-plans/export',
          });
        }
        if (err instanceof ApiClientError && err.statusCode === 413) {
          const fromDetails = countFromExportError({
            message: err.message,
            details: err.details as { total?: unknown; matched_count?: unknown } | undefined,
          });
          toastExportCap(fromDetails ?? 'N');
        }
        throw err;
      }
    },
  });
}
