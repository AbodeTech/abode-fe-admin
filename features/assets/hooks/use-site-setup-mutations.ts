'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPut } from '@/lib/api-client';

import { SetBoundaryResultSchema, type SetBoundaryFormValues } from '../schemas/site-setup.schema';
import { assetKeys } from './query-keys';

/**
 * PUT /admin/assets/:assetId/boundary — sets the approved boundary that
 * fencing progress is measured against. Always invalidates rather than
 * caching the PUT response directly: it returns only `{version, sides,
 * perimeter_metres}`, missing `is_current`/`source`/`approved_at`/`note`
 * that the site-setup and history views need, so a fresh GET is the only
 * response that's safe to render from.
 */
export const useSetBoundary = (assetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SetBoundaryFormValues) =>
      apiPut(`/admin/assets/${assetId}/boundary`, values, SetBoundaryResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.siteSetup(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.boundaryHistory(assetId) });
    },
  });
};
