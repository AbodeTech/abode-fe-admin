'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { BoundaryVersionSchema, SiteSetupSchema } from '../schemas/site-setup.schema';
import { assetKeys } from './query-keys';

/** GET /admin/assets/:assetId/site-setup — boundary + fencing/clearing/parcelation progress, one call. */
export const useSiteSetup = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.siteSetup(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/site-setup`, SiteSetupSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/**
 * GET /admin/assets/:assetId/boundary — every approved version, newest first.
 * A plain array response, not a paginated list (the real endpoint has no
 * page/limit params at all), so this reads through `apiGet` rather than
 * `apiGetPaged`.
 */
export const useBoundaryHistory = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.boundaryHistory(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/boundary`, z.array(BoundaryVersionSchema)),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
