'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CSManagerTargetSchema } from '../schemas/cs-manager.schema';
import { csManagerKeys } from './query-keys';
import { z } from 'zod';

/** GET /admin/cs-managers/:manager_id/targets — every month, no pagination. */
export const useCSManagerTargets = (managerId: string | null) =>
  useQuery({
    queryKey: csManagerKeys.targets(managerId ?? ''),
    queryFn: () => apiGet(`/admin/cs-managers/${managerId}/targets`, z.array(CSManagerTargetSchema)),
    enabled: !!managerId,
  });

/** GET /admin/cs-managers/:manager_id/targets/:year/:month — null when unset. */
export const useCSManagerTarget = (managerId: string | null, year: number, month: number) =>
  useQuery({
    queryKey: csManagerKeys.target(managerId ?? '', year, month),
    queryFn: () =>
      apiGet(
        `/admin/cs-managers/${managerId}/targets/${year}/${month}`,
        CSManagerTargetSchema.nullable()
      ),
    enabled: !!managerId,
  });
