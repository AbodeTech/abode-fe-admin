'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import {
  AssetOverrideSchema,
  AssetUserOverrideSchema,
  UserOverrideSchema,
} from '../schemas/override.schema';
import type {
  AssetOverridePayload,
  SubjectOverridePayload,
} from '../schemas/override-form.schema';
import { commissionKeys } from './query-keys';

/**
 * POST /admin/commission/overrides/asset — **upsert**, keyed on
 * `(asset_id, offer_type)`. Creating and editing are the same call, so there
 * is no separate update hook.
 *
 * `granted_by` is recorded server-side from the admin JWT, and `revoked_at` is
 * cleared — re-saving a revoked override reinstates it.
 *
 * Applies to new payment plans only. Plans that already exist keep the rate
 * frozen onto them at creation.
 */
export const useUpsertAssetOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssetOverridePayload) =>
      apiPost('/admin/commission/overrides/asset', payload, AssetOverrideSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.overrides() });
    },
  });
};

/**
 * POST /admin/commission/overrides/user — upsert keyed on
 * `(user_id, offer_type)`. Applies to this referrer across every asset.
 */
export const useUpsertUserOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubjectOverridePayload) =>
      apiPost('/admin/commission/overrides/user', payload, UserOverrideSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.overrides() });
    },
  });
};

/**
 * POST /admin/commission/overrides/asset-user — upsert keyed on
 * `(asset_id, user_id, offer_type)`. The most specific override: it wins over
 * a blanket referrer rate, but only for the asset it names.
 */
export const useUpsertAssetUserOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubjectOverridePayload) =>
      apiPost('/admin/commission/overrides/asset-user', payload, AssetUserOverrideSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.overrides() });
    },
  });
};
