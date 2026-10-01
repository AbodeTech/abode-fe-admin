'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPut } from '@/lib/api-client';

import {
  StandingConfigSchema,
  StandingMemberSchema,
  StandingSummarySchema,
  type UpdateStandingConfigPayload,
} from '../schemas/standing.schema';
import { standingKeys } from './query-keys';

/** GET /admin/standing/config — the ladder as ops configured it. */
export const useStandingConfig = () =>
  useQuery({
    queryKey: standingKeys.config(),
    queryFn: () => apiGet('/admin/standing/config', StandingConfigSchema),
  });

/** GET /admin/standing/summary — the ladder with how many buyers stand on each rung. */
export const useStandingSummary = () =>
  useQuery({
    queryKey: standingKeys.summary(),
    queryFn: () => apiGet('/admin/standing/summary', StandingSummarySchema),
  });

/** GET /admin/standing/members — who is on one checkpoint, biggest holders first. */
export const useStandingMembers = (
  checkpoint: string | null,
  params: { page: number; limit: number; search?: string }
) =>
  useQuery({
    queryKey: standingKeys.members(checkpoint ?? '', params),
    queryFn: () =>
      apiGetPaged('/admin/standing/members', StandingMemberSchema, {
        params: {
          checkpoint,
          page: params.page,
          limit: params.limit,
          ...(params.search ? { search: params.search } : {}),
        },
      }),
    enabled: !!checkpoint,
    // A member list is a snapshot of a derived number; re-fetching it on every
    // focus would churn without telling the admin anything new.
    staleTime: 30_000,
  });

/**
 * PUT /admin/standing/config — replaces the whole ladder.
 *
 * Invalidates the summary and every member list as well as the config: moving a
 * threshold moves real buyers between rungs, so a stale "12 members" beside a
 * boundary that just changed is worse than a spinner.
 */
export const useUpdateStandingConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStandingConfigPayload) =>
      apiPut('/admin/standing/config', payload, StandingConfigSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standingKeys.all });
    },
  });
};
