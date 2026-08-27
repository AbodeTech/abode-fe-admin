'use client';

import { useAuthStore } from '@/store/auth-store';

import { useCSManagers } from './use-cs-managers';

/**
 * Resolves whether the logged-in admin is themselves a CS Manager, and if
 * so which one.
 *
 * **Matched by email**, not by id — `POST /auth/admin/login` doesn't return
 * the admin's own `_id`, so `useAuthStore().user.id` can't be matched
 * against `manager.id`. `getDashboard` takes a required `manager_id`, so
 * the manager view can only load its own data by looking the id up here
 * first.
 */
export const useIsCurrentCSManager = (): {
  isCSManager: boolean;
  csManagerId: string | null;
  isLoading: boolean;
} => {
  const { user } = useAuthStore();
  const { data, isLoading } = useCSManagers();

  if (isLoading || !user?.email || !data) {
    return { isCSManager: false, csManagerId: null, isLoading };
  }

  const email = user.email.toLowerCase();
  const match = data.find((m) => m.manager?.email?.toLowerCase() === email);

  return {
    isCSManager: !!match,
    csManagerId: match?.manager?.id ?? null,
    isLoading: false,
  };
};
