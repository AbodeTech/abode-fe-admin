'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { FinancialOfficerTargetSchema } from '../schemas/financial-officer.schema';
import { financialOfficerKeys } from './query-keys';

/** GET /admin/financial-officers/:officer_id/targets — every month, no pagination. */
export const useFinancialOfficerTargets = (officerId: string | null) =>
  useQuery({
    queryKey: financialOfficerKeys.targets(officerId ?? ''),
    queryFn: () =>
      apiGet(
        `/admin/financial-officers/${officerId}/targets`,
        z.array(FinancialOfficerTargetSchema)
      ),
    enabled: !!officerId,
  });
