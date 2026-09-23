'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPut } from '@/lib/api-client';

import {
  DivisionConfigSchema,
  DivisionMemberSchema,
  DivisionSummarySchema,
  type UpdateDivisionConfigPayload,
} from '../schemas/division.schema';
import { divisionKeys } from './query-keys';

/** GET /admin/division/config — the ladder as ops configured it. */
export const useDivisionConfig = () =>
  useQuery({
    queryKey: divisionKeys.config(),
    queryFn: () => apiGet('/admin/division/config', DivisionConfigSchema),
  });

/**
 * GET /admin/division/summary — the ladder with how many associates are in each
 * division, for one season.
 *
 * `seasonYear` null means "the live season", which the server resolves. Passing
 * the current year explicitly would work too, but only until midnight on 31
 * December.
 */
export const useDivisionSummary = (seasonYear: number | null) =>
  useQuery({
    queryKey: divisionKeys.summary(seasonYear),
    queryFn: () =>
      apiGet('/admin/division/summary', DivisionSummarySchema, {
        params: seasonYear ? { season_year: seasonYear } : {},
      }),
  });

/** GET /admin/division/members — who is in one division, most land first. */
export const useDivisionMembers = (
  seasonYear: number | null,
  tier: string | null,
  params: { page: number; limit: number; search?: string }
) =>
  useQuery({
    queryKey: divisionKeys.members(seasonYear, tier ?? '', params),
    queryFn: () =>
      apiGetPaged('/admin/division/members', DivisionMemberSchema, {
        params: {
          tier,
          ...(seasonYear ? { season_year: seasonYear } : {}),
          page: params.page,
          limit: params.limit,
          ...(params.search ? { search: params.search } : {}),
        },
      }),
    enabled: !!tier,
    // A member list is last night's sweep, not a live figure — re-fetching on
    // every focus would churn without telling the admin anything new.
    staleTime: 30_000,
  });

/**
 * PUT /admin/division/config — replaces the whole ladder.
 *
 * Invalidates the summary and every member list as well as the config: moving a
 * threshold moves real associates between divisions, so a stale "12 members"
 * beside a boundary that just changed is worse than a spinner.
 */
export const useUpdateDivisionConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDivisionConfigPayload) =>
      apiPut('/admin/division/config', payload, DivisionConfigSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.all });
    },
  });
};
