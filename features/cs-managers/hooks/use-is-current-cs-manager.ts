'use client';

import { useHasPermission } from '@/hooks/use-admin-permission';
import { useAuthStore } from '@/store/auth-store';

import { useCSManagerMe } from './use-cs-manager-me';
import { useCSManagers } from './use-cs-managers';

/**
 * Whether the logged-in admin is themselves a CS Manager, and if so their
 * admin id (the value every `:manager_id` route takes).
 *
 * Backed by `GET /admin/cs-managers/me`, which answers for every admin. Being
 * a CS Manager is the assignment record, not a permission, so a CS Manager on
 * the viewer role must still be recognised here.
 *
 * Fallback, while that route isn't deployed: match the signed-in email against
 * the manager list. That list needs `view_cs_manager_tracker`, which viewers
 * hold only until the BE role realignment runs, so the `me` route has to be
 * live before that script runs. Remove the fallback once it is.
 */
export const useIsCurrentCSManager = (): {
  isCSManager: boolean;
  csManagerId: string | null;
  isLoading: boolean;
} => {
  const { user } = useAuthStore();
  const canListManagers = useHasPermission('view_cs_manager_tracker');
  const me = useCSManagerMe();

  const needsFallback = me.isSuccess && me.data === null;
  const list = useCSManagers({ enabled: needsFallback && canListManagers });

  if (me.isLoading || (needsFallback && list.isLoading)) {
    return { isCSManager: false, csManagerId: null, isLoading: true };
  }

  if (me.data) {
    return {
      isCSManager: me.data.is_cs_manager,
      csManagerId: me.data.manager?.manager?.id ?? null,
      isLoading: false,
    };
  }

  const email = user?.email?.toLowerCase();
  const match = email
    ? list.data?.find((m) => m.manager?.email?.toLowerCase() === email)
    : undefined;

  return {
    isCSManager: !!match,
    csManagerId: match?.manager?.id ?? null,
    isLoading: false,
  };
};
