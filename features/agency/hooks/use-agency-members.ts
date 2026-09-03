'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import {
  AgencyMemberSchema,
  buildAgencyMemberParams,
  type AgencyMemberQuery,
} from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/**
 * GET /admin/agencies/:id/members — the roster, searchable across name,
 * email, username and phone.
 *
 * The owner is included by default and flagged with `is_owner`, so the table
 * can mark them rather than the caller having to cross-reference the detail
 * response.
 */
export const useAgencyMembers = (
  agencyId: string | null | undefined,
  filters: AgencyMemberQuery
) =>
  useQuery({
    queryKey: agencyKeys.members(agencyId ?? '', filters),
    queryFn: () =>
      apiGetPaged(`/admin/agencies/${agencyId}/members`, AgencyMemberSchema, {
        params: buildAgencyMemberParams(filters),
      }),
    enabled: !!agencyId,
  });
