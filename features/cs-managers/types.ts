/**
 * CS Manager feature — local, FE-only types.
 *
 * The dashboard / list / mutation shapes now come from codegen
 * (@/lib/gql/graphql). What lives here is only the picker-row shape
 * the FE synthesises by normalizing the shared AdminRoles endpoint —
 * no BE type for it because it's a local view-model.
 */

/** Admin picker option — synthesised from getAllAdminWithRoles by the
 * `useAdminOptions` hook. Used by AddCSManagerDialog and reused by
 * anything else that wants an admin picker with an "already CSM?" hint. */
export interface AdminOption {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isCSManager: boolean;
}
