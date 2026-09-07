/**
 * Which roles count as top-level authority.
 *
 * This codebase has called `role === "admin"` the "super admin" since before a
 * literal `superadmin` role existed. Now that one does — sitting above admin
 * and carrying `manage_all_tickets` — that shorthand would quietly lock a
 * promoted admin out of every page still testing for the old string. Anywhere
 * that used to ask `role === "admin"` for top-level access asks this instead,
 * so a promotion adds authority rather than removing it.
 *
 * This is a rendering convenience. Real enforcement is server-side, per
 * permission, in the service that performs the act.
 */
export const TOP_LEVEL_ADMIN_ROLES = ["admin", "superadmin"] as const;

export const isTopLevelAdmin = (role?: string | null): boolean =>
  !!role && (TOP_LEVEL_ADMIN_ROLES as readonly string[]).includes(role);
