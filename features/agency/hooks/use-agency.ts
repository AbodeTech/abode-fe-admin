'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { AgencyDetailSchema } from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/**
 * GET /admin/agencies/:id — the agency with its owner expanded, its member
 * count and its lifetime commission total.
 */
export const useAgency = (agencyId: string | null | undefined) =>
  useQuery({
    queryKey: agencyKeys.detail(agencyId ?? ''),
    queryFn: () => apiGet(`/admin/agencies/${agencyId}`, AgencyDetailSchema),
    enabled: !!agencyId,
  });
