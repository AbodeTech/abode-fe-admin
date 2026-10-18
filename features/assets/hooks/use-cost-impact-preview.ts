'use client';

import { useMutation } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { CostImpactPreviewSchema, type ImpactPreviewInput } from '../schemas/cost-impact-preview.schema';

/**
 * POST /admin/assets/:assetId/costs/impact-preview — never invalidates or
 * writes anything. Always evaluates against CURRENT rules everywhere else
 * (the real endpoint has no `as_of`), so re-run this on demand from the
 * allocation-rule form's current draft values.
 */
export const useCostImpactPreview = (assetId: string) =>
  useMutation({
    mutationFn: (input: ImpactPreviewInput) =>
      apiPost(`/admin/assets/${assetId}/costs/impact-preview`, input, CostImpactPreviewSchema),
  });
