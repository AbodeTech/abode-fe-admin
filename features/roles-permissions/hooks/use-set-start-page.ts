'use client';

import { useMutation } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

import {
  StartPageResultSchema,
  type SetStartPagePayload,
} from '../schemas/admin-access.schema';

/**
 * PATCH /admin/me/start-page — the signed-in admin picks where they land after
 * sign-in. No permission: every admin may set their own.
 *
 * The value must be the landing page of a role they hold, or `null` to go back
 * to the primary role's page; the BE answers 400 `START_PAGE_NOT_AVAILABLE`
 * (with the list that is available) for anything else. The response carries the
 * RESOLVED `start_page`, so the stored session is updated from it rather than
 * the frontend working the answer out itself.
 *
 * The session lives in the auth store (not React Query), so that is what gets
 * patched; a reload re-reads `GET /auth/admin/me` and agrees.
 */
export const useSetStartPage = () => {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (payload: SetStartPagePayload) =>
      apiPatch('/admin/me/start-page', payload, StartPageResultSchema),
    onSuccess: (result) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      login({
        ...user,
        start_page: result.start_page,
        start_page_choice: result.start_page_choice,
      });
    },
  });
};
