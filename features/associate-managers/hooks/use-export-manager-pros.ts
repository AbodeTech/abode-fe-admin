'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import type { ManagerDashboardParams } from '../schemas/manager-dashboard.schema';

export type RosterExportScope = 'single' | 'combined' | 'system';

/**
 * The roster CSV — @SkipTransform on the BE, so it streams `text/csv` rather
 * than the JSON envelope. Bypasses apiGet for that reason, exactly like the
 * cs-managers / flex-leads exports.
 *
 * The BE builds and CAPS the whole set (50k rows) before writing a byte, so an
 * over-cap filter fails as clean JSON (`EXPORT_TOO_LARGE`) instead of half a
 * file. It also writes the audit log before the first byte — an interrupted
 * download is still recorded as an extraction.
 *
 * Throttled to 10/hour per admin.
 */
export const useExportManagerDashboardPros = () =>
  useMutation({
    mutationFn: async ({
      scope,
      managerId,
      params,
    }: {
      scope: RosterExportScope;
      /** Required when scope is `single`; ignored otherwise. */
      managerId?: string | null;
      params: ManagerDashboardParams;
    }) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      if (scope === 'single' && !managerId) {
        throw new Error('A manager is required to export a single roster.');
      }

      const path =
        scope === 'single'
          ? `/admin/managers/${managerId}/exports/pros`
          : `/admin/managers/exports/pros/${scope === 'combined' ? 'all' : 'system'}`;

      const response = await apiClient.get(path, { params, responseType: 'blob' });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'associate-pros.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
