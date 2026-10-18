'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';
import { dispatchMockRequest } from '@/lib/mocks';

export const useDownloadTicketPdf = () =>
  useMutation({
    mutationFn: async (rewardId: string) => {
      if (isMockApiEnabled()) {
        const payload = await dispatchMockRequest({
          method: 'GET',
          path: `/admin/campaigns/rewards/${rewardId}/ticket.pdf`,
          query: {},
          body: undefined,
        });
        const blob = new Blob([typeof payload === 'string' ? payload : 'Mock ticket PDF'], {
          type: 'application/pdf',
        });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      const response = await apiClient.get(`/admin/campaigns/rewards/${rewardId}/ticket.pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
