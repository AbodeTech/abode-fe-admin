'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { GroundConfirmationSchema } from '../schemas/ground-confirmation.schema';

/** GET /admin/plots/:plotId/ground-confirmation — reports for the current plot allocation. */
export const useGroundConfirmationHistory = (plotId: string, options: { enabled?: boolean; planId?: string | null } = {}) =>
  useQuery({
    queryKey: ['plots', plotId, 'ground-confirmation', options.planId ?? null] as const,
    queryFn: () => apiGet(`/admin/plots/${plotId}/ground-confirmation`, z.array(GroundConfirmationSchema)),
    enabled: Boolean(plotId) && (options.enabled ?? true),
  });
