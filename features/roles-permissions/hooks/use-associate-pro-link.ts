'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiGetPaged, apiPatch } from '@/lib/api-client';

import {
  AssociateProLinkResultSchema,
  AssociateProUserSchema,
} from '../schemas/admin-access.schema';
import { rolesKeys } from './query-keys';

/**
 * PATCH /admin/admins/:id/associate-pro (link) and DELETE (unlink) — which Associate Pro
 * user an admin account is, so the personal Associate Pro tracker can read their own
 * numbers. Both take `manage_admins`.
 *
 * Linking is refused (400/404/409) when the user is not an Associate Pro, does not exist,
 * or is already linked to a different admin; the BE's message says which, so the caller
 * shows it as it is. Each change is logged.
 */
export const useSetAdminAssociatePro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, userId }: { adminId: string; userId: string | null }) =>
      userId
        ? apiPatch(`/admin/admins/${adminId}/associate-pro`, { associate_pro_user_id: userId }, AssociateProLinkResultSchema)
        : apiDelete(`/admin/admins/${adminId}/associate-pro`, AssociateProLinkResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
};

/**
 * Associate Pro users to pick from: GET /admin/users filtered to that tier. Needs
 * `view_users`; without it the caller cannot search and the tab says so.
 */
export const useAssociateProSearch = (search: string, enabled: boolean) =>
  useQuery({
    queryKey: [...rolesKeys.all, 'associate-pro-search', search] as const,
    enabled,
    queryFn: async () => {
      const { items } = await apiGetPaged('/admin/users', AssociateProUserSchema, {
        params: { tier: 'associate-pro', limit: 8, ...(search ? { search } : {}) },
      });
      return items;
    },
    staleTime: 30 * 1000,
  });

/**
 * The user an admin is currently linked to, so the tab can show a name instead of an id.
 * GET /admin/users/:id needs `view_user`. A failure is not an error here: the tab falls
 * back to the id.
 */
export const useLinkedAssociatePro = (userId: string | null) =>
  useQuery({
    queryKey: [...rolesKeys.all, 'associate-pro-linked', userId] as const,
    enabled: !!userId,
    queryFn: () => apiGet(`/admin/users/${userId}`, AssociateProUserSchema),
    retry: false,
    staleTime: 60 * 1000,
  });
