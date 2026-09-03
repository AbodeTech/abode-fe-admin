'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiPatch } from '@/lib/api-client';

import {
  DeveloperPlotConfigResponseSchema,
  DeveloperPlotConfigSchema,
} from '../schemas/commission.schema';
import { commissionKeys } from './query-keys';

/**
 * The developer-plot three-way split. GET is null until first configured —
 * and until then, developer-plot sales fail commission resolution outright
 * (`DEVELOPER_PLOT_CONFIG_MISSING`), so the card treats "unset" as a warning
 * state, not an empty one.
 */
export const useDeveloperPlotConfig = () =>
  useQuery({
    queryKey: [...commissionKeys.all, 'developer-plot-config'] as const,
    queryFn: () =>
      apiGet('/admin/commission/developer-plot-config', DeveloperPlotConfigResponseSchema),
  });

export type DeveloperPlotConfigPayload = {
  /** Exactly two, distinct — the BE refuses otherwise. */
  founder_user_ids: [string, string];
  founder_referrer_rate?: number;
  founder_bystander_rate?: number;
  external_referrer_rate?: number;
  founder_rate_when_external_referrer?: number;
  reason?: string;
};

/** PATCH — bumps the version; plans that already exist keep their snapshot. */
export const useUpsertDeveloperPlotConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeveloperPlotConfigPayload) =>
      apiPatch('/admin/commission/developer-plot-config', payload, DeveloperPlotConfigSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...commissionKeys.all, 'developer-plot-config'],
      });
    },
  });
};

/**
 * Resolve a founder id to a display name via GET /admin/users/:id — the
 * config's refs arrive unpopulated. Cached hard; founders change rarely.
 */
const AdminUserViewSchema = z.looseObject({
  _id: z.string().optional(),
  id: z.string().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

export const useUserDisplayName = (userId: string | null | undefined) =>
  useQuery({
    queryKey: ['users', 'display-name', userId ?? ''] as const,
    queryFn: async () => {
      const user = await apiGet(`/admin/users/${userId}`, AdminUserViewSchema);
      const name = [
        user.last_name ?? user.lastName,
        user.first_name ?? user.firstName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      return name || user.email || null;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
