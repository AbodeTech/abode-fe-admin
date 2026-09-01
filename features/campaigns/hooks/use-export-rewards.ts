'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';
import { dispatchMockRequest } from '@/lib/mocks';

import type { CampaignRewardFilters } from './query-keys';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const useExportRewards = (campaignId: string) =>
  useMutation({
    mutationFn: async (filters: CampaignRewardFilters) => {
      if (isMockApiEnabled()) {
        const payload = await dispatchMockRequest({
          method: 'GET',
          path: `/admin/campaigns/${campaignId}/rewards/export`,
          query: {
            role: filters.role || undefined,
            is_active:
              filters.is_active === null || filters.is_active === undefined
                ? undefined
                : filters.is_active,
          },
          body: undefined,
        });
        const csv = typeof payload === 'string' ? payload : String(payload);
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `campaign-${campaignId}-rewards.csv`);
        return { filename: `campaign-${campaignId}-rewards.csv` };
      }

      const response = await apiClient.get(`/admin/campaigns/${campaignId}/rewards/export`, {
        params: {
          role: filters.role || undefined,
          is_active:
            filters.is_active === null || filters.is_active === undefined
              ? undefined
              : filters.is_active,
        },
        responseType: 'blob',
      });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `campaign-${campaignId}-rewards.csv`;
      downloadBlob(response.data as Blob, filename);
      return { filename };
    },
  });
