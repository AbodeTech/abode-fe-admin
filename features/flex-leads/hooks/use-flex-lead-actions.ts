'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, apiDelete, apiPatch } from '@/lib/api-client';
import { isMockApiEnabled } from '@/lib/mocks/config';

import {
  DeleteFlexLeadResultSchema,
  FlexLeadRowSchema,
  type FlexLeadStatus,
} from '../schemas/flex-lead.schema';
import { flexLeadKeys, type FlexLeadListFilters } from './query-keys';

/* ============================================================
 * Admin actions on a Flex lead: status/notes update, soft delete, and the
 * CSV export. All real — main's version of this hook served dummy data
 * because the API didn't exist yet.
 * ============================================================ */

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flexLeadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flexLeadKeys.counts() });
    },
  });
}

export const useUpdateFlexLead = () =>
  useInvalidatingMutation(
    (args: { id: string; status?: FlexLeadStatus; admin_notes?: string | null }) =>
      apiPatch(
        `/admin/flex-leads/${args.id}`,
        {
          ...(args.status !== undefined ? { status: args.status } : {}),
          ...(args.admin_notes !== undefined ? { admin_notes: args.admin_notes ?? '' } : {}),
        },
        FlexLeadRowSchema
      )
  );

/** Soft delete (FL-5) — the lead leaves the working list but stays queryable. */
export const useDeleteFlexLead = () =>
  useInvalidatingMutation((args: { id: string }) =>
    apiDelete(`/admin/flex-leads/${args.id}`, DeleteFlexLeadResultSchema)
  );

/**
 * GET /admin/flex-leads/export — a streaming CSV with `@SkipTransform`, so it
 * deliberately bypasses `apiGet` (no envelope to unwrap) and uses the raw
 * axios client. The server refuses sets above 50k rows (`EXPORT_TOO_LARGE`)
 * before any bytes stream, so failure is clean JSON, not half a file.
 *
 * Not available in mock mode — the mock transport can't stream files; the
 * button says so instead of failing quietly.
 */
export const useExportFlexLeads = () =>
  useMutation({
    mutationFn: async (filters: Pick<FlexLeadListFilters, 'status' | 'type' | 'q' | 'include_deleted'>) => {
      if (isMockApiEnabled()) {
        throw new Error('Export is unavailable in mock mode — point the app at a real backend.');
      }

      const response = await apiClient.get('/admin/flex-leads/export', {
        params: {
          status: filters.status,
          type: filters.type,
          q: filters.q || undefined,
          include_deleted: filters.include_deleted ? 'true' : undefined,
        },
        responseType: 'blob',
      });

      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'flex-leads.csv';

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
