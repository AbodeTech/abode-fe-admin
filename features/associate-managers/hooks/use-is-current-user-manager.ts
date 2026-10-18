'use client';

import { useManagerMe } from './use-manager-me';

/**
 * Whether the logged-in admin is also an Associate Manager, and if so their
 * own manager id (the value every `:manager_id` route takes).
 *
 * Backed by `GET /admin/managers/me`. This used to page the whole manager list
 * and match on EMAIL, because `POST /auth/admin/login` doesn't return the
 * admin's `_id` and the manager list was the only place an id could be found.
 * The `me` route answers directly, so neither the list fetch nor the email
 * match is needed.
 */
export const useIsCurrentUserManager = (): {
  isManager: boolean;
  managerId: string | null;
  isLoading: boolean;
} => {
  const { data, isLoading } = useManagerMe();

  if (isLoading || !data) {
    return { isManager: false, managerId: null, isLoading };
  }

  return {
    isManager: data.is_manager,
    managerId: data.manager?.manager_id ?? null,
    isLoading: false,
  };
};
