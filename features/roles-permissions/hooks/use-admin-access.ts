'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch, apiPut } from '@/lib/api-client';

import {
  ExtraPermissionsResultSchema,
  StartPageResultSchema,
  type SetExtraPermissionsPayload,
  type SetStartPagePayload,
} from '../schemas/admin-access.schema';
import { rolesKeys } from './query-keys';

/**
 * PUT /admin/admins/:id/extra-permissions — the single permissions a person holds
 * on top of their roles. Takes `manage_admins`.
 *
 * Send the FULL list: it replaces what is stored. The BE refuses (403) a key the
 * caller does not hold themselves, any super-admin-only key from a non-super
 * admin, and any change to the caller's own list. Each change is logged.
 */
export const useSetAdminExtraPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, permissions }: { adminId: string } & SetExtraPermissionsPayload) =>
      apiPut(
        `/admin/admins/${adminId}/extra-permissions`,
        { permissions },
        ExtraPermissionsResultSchema,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};

/**
 * PATCH /admin/admins/:id/start-page — where another admin lands after sign-in.
 * Takes `manage_admins`. The value must be the landing page of a role they hold,
 * or `null` to use their primary role's page (400 `START_PAGE_NOT_AVAILABLE`
 * otherwise). People set their OWN with `useSetStartPage` (the header chip).
 */
export const useSetAdminStartPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, start_page }: { adminId: string } & SetStartPagePayload) =>
      apiPatch(`/admin/admins/${adminId}/start-page`, { start_page }, StartPageResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};
