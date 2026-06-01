import { useAuthStore } from "@/store/auth-store";
import { useAssociateManagers } from "./use-associate-managers";

/**
 * Returns true when the logged-in admin is also an Associate Manager.
 *
 * **Matched by email**, not by id. The reason: the `signinAdmin` mutation
 * (`actions/auth.ts`) doesn't currently return the admin's `_id`, only
 * `{ authToken, role, permissions }`. So `useAuthStore().user.id` is
 * effectively undefined and can't be matched against `manager._id`.
 *
 * Email-matching works because:
 *   - the auth store always has the email the admin signed in with
 *   - the managers list response includes `manager.email`
 *
 * Swap this implementation when one of these lands:
 *   - BE adds `_id` to the signin response (cleanest single-line fix), OR
 *   - BE adds a dedicated `getMyAssociateManager` query (avoids the list
 *     fetch entirely for non-managers).
 */
export const useIsCurrentUserManager = (): {
  isManager: boolean;
  isLoading: boolean;
} => {
  const { user } = useAuthStore();
  const { data, isLoading } = useAssociateManagers({ page: 1, limit: 200 });

  if (isLoading || !user?.email || !data?.results) {
    return { isManager: false, isLoading };
  }

  const email = user.email.toLowerCase();
  const isManager = data.results.some(
    (m) => m.manager?.email?.toLowerCase() === email
  );
  return { isManager, isLoading: false };
};
