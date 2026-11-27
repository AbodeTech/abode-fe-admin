"use client";

import type { ReactNode } from "react";

import { useCanAccess } from "@/hooks/use-access";
import type { AccessRule, AdminPermission } from "@/lib/rbac";

type CanProps = {
  children: ReactNode;
  /** Shown instead of `children` when access is refused. Default: nothing. */
  fallback?: ReactNode;
} & (
  | { permission: AdminPermission; any?: never; all?: never; rule?: never }
  | { any: readonly AdminPermission[]; permission?: never; all?: never; rule?: never }
  | { all: readonly AdminPermission[]; permission?: never; any?: never; rule?: never }
  | { rule: AccessRule; permission?: never; any?: never; all?: never }
);

/**
 * Renders `children` only when the signed-in admin may see them.
 *
 *   <Can permission="manage_campaigns"><Button>New Campaign</Button></Can>
 *   <Can any={["approve_payments", "withdrawals"]}>…</Can>
 *   <Can rule={page.access}>…</Can>
 *
 * This is a usability gate: it keeps a button off the screen for someone the
 * server would refuse anyway. The server stays the authority — never rely on
 * this to protect anything.
 */
export function Can({ children, fallback = null, ...check }: CanProps) {
  const rule: AccessRule =
    "rule" in check && check.rule
      ? check.rule
      : "all" in check && check.all
        ? { all: check.all }
        : { any: "any" in check && check.any ? check.any : [check.permission as AdminPermission] };

  return <>{useCanAccess(rule) ? children : fallback}</>;
}
