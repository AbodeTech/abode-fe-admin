'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { ManagerTargetSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/** GET /admin/managers/:manager_id/targets — every month's target, for the history table. */
export const useManagerTargets = (managerId: string | null | undefined) =>
  useQuery({
    queryKey: managerKeys.targetsAll(managerId ?? ''),
    queryFn: () =>
      apiGet(`/admin/managers/${managerId}/targets`, z.array(ManagerTargetSchema)),
    enabled: !!managerId,
  });

/**
 * GET /admin/managers/:manager_id/targets/:year/:month — one month.
 *
 * `null` means no target was set for that month, which is NOT the same as a
 * target of zero: the dashboard scores an unset target as 0 components rather
 * than as a met goal.
 */
export const useManagerTarget = (
  managerId: string | null | undefined,
  year?: number | null,
  month?: number | null
) =>
  useQuery({
    queryKey: managerKeys.target(managerId ?? '', year, month),
    queryFn: () =>
      apiGet(
        `/admin/managers/${managerId}/targets/${year}/${month}`,
        ManagerTargetSchema.nullable()
      ),
    enabled: !!managerId && !!year && !!month,
  });
