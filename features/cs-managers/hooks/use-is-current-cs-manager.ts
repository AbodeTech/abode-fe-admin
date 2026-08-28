"use client";

import { useAuthStore } from "@/store/auth-store";
import { useCSManagersList } from "./use-cs-managers-list";

/**
 * Resolves whether the logged-in admin is themselves a CS Manager, and if
 * so which one.
 *
 * **Matched by email**, not by id — same constraint as the APM equivalent
 * (`use-is-current-user-manager.ts`): the `signinAdmin` mutation doesn't
 * return the admin's `_id`, so `useAuthStore().user.id` can't be matched
 * against `manager._id`.
 *
 * Unlike APM this hook also has to hand back the id. APM's manager view
 * calls `managerDashboard(filter)`, which resolves the caller BE-side, so
 * it never needs one. `getCSManagerDashboard` takes a required
 * `managerId`, so the CS manager view can only load its own data by
 * looking the id up here first.
 *
 * Replace this when either lands:
 *   - BE adds `_id` to the signin response, or
 *   - BE adds a `csManagerDashboard(month, year)` self query, which would
 *     remove the need to resolve an id on the client at all.
 */
export const useIsCurrentCSManager = (): {
  isCSManager: boolean;
  csManagerId: string | null;
  isLoading: boolean;
} => {
  const { user } = useAuthStore();
  const { data, isLoading } = useCSManagersList();

  if (isLoading || !user?.email || !data) {
    return { isCSManager: false, csManagerId: null, isLoading };
  }

  const email = user.email.toLowerCase();
  const match = data.find(
    (m) => m.manager.email?.toLowerCase() === email
  );

  return {
    isCSManager: !!match,
    csManagerId: match?.manager._id ?? null,
    isLoading: false,
  };
};
