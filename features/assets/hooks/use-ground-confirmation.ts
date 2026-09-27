'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { GroundConfirmationSchema } from '../schemas/ground-confirmation.schema';

/** GET /admin/plots/:plotId/ground-confirmation — every field submission for this plot, newest first. */
export const useGroundConfirmationHistory = (plotId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ['plots', plotId, 'ground-confirmation'] as const,
    queryFn: () => apiGet(`/admin/plots/${plotId}/ground-confirmation`, z.array(GroundConfirmationSchema)),
    enabled: Boolean(plotId) && (options.enabled ?? true),
  });
