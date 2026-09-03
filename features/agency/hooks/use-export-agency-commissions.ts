'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

import { ApiClientError, apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks';

import {
  buildAgencyCommissionParams,
  type AgencyCommissionQuery,
} from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/* ============================================================
 * GET /admin/agencies/:id/commissions/export — takes `export_agencies`.
 *
 * The BE streams CSV rather than wrapping it in the JSON envelope
 * (`@SkipTransform`), so this bypasses the apiGet helpers and drives axios
 * directly with `responseType: 'blob'`.
 *
 * Two BE limits worth surfacing distinctly:
 *  - 50,000 matched rows, refused with a 413 before anything streams
 *  - 10 exports per hour per admin, refused with a 429
 *
 * Errors arrive as a Blob because of `responseType`, so the JSON body has to
 * be read back out of it to recover the row count.
 * ============================================================ */

const EXPORT_ROW_CAP = 50_000;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Pull `details.matched_count` out of an error body that arrived as a Blob. */
async function matchedCountFromBlob(data: unknown): Promise<number | null> {
  if (!(data instanceof Blob)) return null;
  try {
    const parsed = JSON.parse(await data.text()) as {
      details?: { matched_count?: unknown };
    };
    const matched = parsed.details?.matched_count;
    return typeof matched === 'number' ? matched : null;
  } catch {
    return null;
  }
}

export function useExportAgencyCommissions(agencyId: string | null | undefined) {
  return useMutation({
    mutationKey: agencyKeys.commissionsExport(agencyId ?? ''),
    mutationFn: async (filters: AgencyCommissionQuery) => {
      const path = `/admin/agencies/${agencyId}/commissions/export`;

      // The export streams every matched row; page/limit are meaningless.
      const params = buildAgencyCommissionParams(filters);
      delete params.page;
      delete params.limit;

      const fallbackName = `agency-commissions-${new Date().toISOString().split('T')[0]}.csv`;

      // The real route streams CSV with @SkipTransform, so there is no JSON
      // payload for a mock route to return. Matches flex-leads.
      if (isMockApiEnabled()) {
        throw new ApiClientError({
          messages: ['Export is unavailable in mock mode — point the app at a real backend.'],
          method: 'GET',
          path,
        });
      }

      try {
        const response = await apiClient.get(path, { params, responseType: 'blob' });
        const disposition = String(response.headers['content-disposition'] ?? '');
        const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
        downloadBlob(response.data as Blob, filename);
        return { filename };
      } catch (err) {
        if (!axios.isAxiosError(err)) throw err;

        if (err.response?.status === 413) {
          const matched = await matchedCountFromBlob(err.response.data);
          throw new ApiClientError({
            messages: [
              matched
                ? `That range covers ${matched.toLocaleString()} rows — narrow it to under ${EXPORT_ROW_CAP.toLocaleString()}.`
                : `Too many rows to export — narrow the date range and try again.`,
            ],
            statusCode: 413,
            method: 'GET',
            path,
          });
        }

        if (err.response?.status === 429) {
          throw new ApiClientError({
            messages: ['Export limit reached — 10 per hour. Try again later.'],
            statusCode: 429,
            method: 'GET',
            path,
          });
        }

        throw err;
      }
    },
  });
}
