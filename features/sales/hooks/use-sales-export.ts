import { useMutation } from '@tanstack/react-query';

import { ApiClientError, apiGetPaged } from '@/lib/api-client';

import { SalesExportRowSchema, type SalesExportRow } from '../schemas/sales.schema';
import { salesKeys } from './query-keys';
import { buildSalesListParams, type SalesListFilters } from './use-sales';

/* ============================================================
 * The custom column-picker/format export UI (SalesExport.tsx) is kept
 * per product decision, rather than switching to the BE's own two fixed-
 * column CSV streams (GET /admin/sales/export[/full]). Those BE endpoints
 * enforce a 50k-row cap, rate limits and an audit log — this client-side
 * path has none of that, so EXPORT_ROW_CAP below is this feature's own
 * (much smaller) safeguard against paging the list endpoint unbounded.
 *
 * The BE caps a single page at 100 rows (`Math.min(limit, 100)` in
 * sales.service.ts), so building an export set means looping pages rather
 * than requesting one huge page like the old GraphQL query did.
 * ============================================================ */

export const EXPORT_ROW_CAP = 3_000;
const EXPORT_PAGE_SIZE = 100;

export interface SalesExportResult {
  rows: SalesExportRow[];
  truncated: boolean;
}

/**
 * `/admin/sales/export/data` allows 30 requests a minute and a full export is
 * exactly that many pages. A 429 means the window is still full (a second export
 * started within the minute), so wait it out and retry the same page rather
 * than failing the whole download. The window is 60s, so 12 x 5s outlasts it.
 */
const RATE_LIMIT_WAIT_MS = 5_000;
const RATE_LIMIT_MAX_RETRIES = 12;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const fetchExportPage = async (filters: SalesListFilters, page: number) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await apiGetPaged('/admin/sales/export/data', SalesExportRowSchema, {
        params: buildSalesListParams({ ...filters, page, limit: EXPORT_PAGE_SIZE }),
      });
    } catch (error) {
      const rateLimited = error instanceof ApiClientError && error.statusCode === 429;
      if (!rateLimited || attempt >= RATE_LIMIT_MAX_RETRIES) throw error;
      await sleep(RATE_LIMIT_WAIT_MS);
    }
  }
};

export const fetchSalesExportRows = async (filters: SalesListFilters): Promise<SalesExportResult> => {
  const rows: SalesExportRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < EXPORT_ROW_CAP) {
    const { items, meta } = await fetchExportPage(filters, page);
    total = meta.total ?? items.length;
    rows.push(...items);
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return { rows, truncated: rows.length < total };
};

export const useSalesExportData = () => {
  return useMutation({
    mutationKey: salesKeys.export(),
    mutationFn: (filters: SalesListFilters) => fetchSalesExportRows(filters),
  });
};
