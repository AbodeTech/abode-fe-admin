'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import {
  AgencyCommissionRowSchema,
  buildAgencyCommissionParams,
  type AgencyCommissionQuery,
} from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/**
 * GET /admin/agencies/:id/commissions — the commission ledger rows this
 * agency earned, optionally bounded by a date range.
 *
 * This is the v2 replacement for v1's agency wallet transaction feed. It is a
 * ledger of earnings, not a wallet: there are no debits, balances or payout
 * rows in it.
 */
export const useAgencyCommissions = (
  agencyId: string | null | undefined,
  filters: AgencyCommissionQuery
) =>
  useQuery({
    queryKey: agencyKeys.commissions(agencyId ?? '', filters),
    queryFn: () =>
      apiGetPaged(`/admin/agencies/${agencyId}/commissions`, AgencyCommissionRowSchema, {
        params: buildAgencyCommissionParams(filters),
      }),
    enabled: !!agencyId,
  });
