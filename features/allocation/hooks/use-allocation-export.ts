'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import { allocationKeys } from './query-keys';
import {
  buildEligibleClientsParams,
  type AllocationClientFilters,
} from './use-allocation-clients';

/**
 * GET /admin/allocation/eligible-clients/export — streaming CSV of the whole
 * filtered set. `export_allocation_list`, separately permissioned from
 * `view_allocations` because the file is client PII.
 *
 * Streamed and BOM-prefixed, not JSON-enveloped (the route is `@SkipTransform`),
 * so this bypasses `apiGet` the same way the users export does and refuses in
 * mock mode rather than handing back a fabricated file.
 *
 * Shares `buildEligibleClientsParams` with the table, so the download always
 * matches what is on screen — including `completed_from`/`completed_to`. The
 * BE ignores `page`/`limit` here (`toFilters` doesn't read them), so they are
 * not sent.
 *
 * Replaces the old GraphQL `eligibleClientsForLand` path, which built the CSV
 * client-side over a different, camelCase row shape and could not see the
 * columns added since — `payment_completed_date` among them.
 */
export const useAllocationExport = () =>
  useMutation({
    mutationKey: allocationKeys.export(),
    mutationFn: async (filters: AllocationClientFilters = {}) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const response = await apiClient.get('/admin/allocation/eligible-clients/export', {
        params: buildEligibleClientsParams(filters),
        responseType: 'blob',
      });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'eligible-clients.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
