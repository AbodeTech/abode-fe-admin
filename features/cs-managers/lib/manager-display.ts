import type { ListCsManagersQuery } from "@/lib/gql/graphql";

/**
 * Row shape matches the operation's actual selection set, not the fuller
 * schema-level CSManagerSummary (which requires all Admin fields). Keeps
 * prop types honest about what the query returns.
 */
export type CSManagerSummary = ListCsManagersQuery["listCSManagers"][number];

export type CSManagerAdmin = CSManagerSummary["manager"];

/**
 * Display shims for the manager/admin side of this feature.
 *
 * The base Admin type ships `userName` + `email` and no firstName/lastName,
 * so we can't honour the app-wide "lastName firstName" order here the way
 * the customer-facing rows do — there's nothing to reorder. We fall back to
 * userName and split on whitespace for initials. Drop both once BE exposes
 * firstName/lastName on Admin (or points the dashboard's manager field at
 * ManagerAdminInfo — same issue as FLEX).
 */
export const csManagerName = (m?: CSManagerAdmin | null) =>
  m?.userName || m?.email || "Manager";

export const csManagerInitials = (m?: CSManagerAdmin | null) => {
  const source = m?.userName || m?.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "?";
};
