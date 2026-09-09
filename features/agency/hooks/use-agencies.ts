'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import {
  AgencyListRowSchema,
  buildAgencyListParams,
  type AgencyListQuery,
} from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/**
 * GET /admin/agencies — paginated, searchable by name or code.
 *
 * The BE caches each page for 30s behind a generation key that every write
 * bumps, so an invalidation after a mutation returns fresh rows rather than
 * the cached page.
 */
export const useAgencies = (filters: AgencyListQuery) =>
  useQuery({
    queryKey: agencyKeys.list(filters),
    queryFn: () =>
      apiGetPaged('/admin/agencies', AgencyListRowSchema, {
        params: buildAgencyListParams(filters),
      }),
  });
