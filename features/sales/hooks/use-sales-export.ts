import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { SalesRowSchema, type SalesRow } from '../schemas/sales.schema';
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

export const EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface SalesExportResult {
  rows: SalesRow[];
  truncated: boolean;
}

export const fetchSalesExportRows = async (filters: SalesListFilters): Promise<SalesExportResult> => {
  const rows: SalesRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < EXPORT_ROW_CAP) {
    const { items, meta } = await apiGetPaged('/admin/sales', SalesRowSchema, {
      params: buildSalesListParams({ ...filters, page, limit: EXPORT_PAGE_SIZE }),
    });
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
