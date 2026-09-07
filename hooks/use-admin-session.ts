"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

/**
 * Who the signed-in admin is, and what they may be shown.
 *
 * Four facts, and each one maps to exactly one thing the UI decides:
 *
 *   isCSManager             holds the CS Manager assignment. Informational.
 *   canDecideTicketRouting  may classify, categorise, assign, group and
 *                           resolve — a CS Manager, or a super admin.
 *   canRouteTickets         also SEES the unassigned pool — the CS Manager
 *                           whose role is "admin", or a super admin. Decides
 *                           which queue chips are worth drawing.
 *   canManageAllTickets     super admin: reads and acts on every ticket,
 *                           whoever it belongs to.
 *
 * All four are computed on the server rather than derived here from role +
 * isCSManager, so each rule has one definition and this cannot drift from what
 * the scoping and the gate actually do.
 *
 * Read from the server rather than from the login payload in the auth store,
 * because `isCSManager` is an active CSManagerAssignment — it can be granted or
 * withdrawn without the admin signing in again, and a cookie set at login would
 * carry a stale answer until the token expired.
 *
 * This decides what to RENDER. It is not the permission itself: every gated act
 * is refused again in the BE service that performs it, so a hidden button and a
 * hand-crafted request fail the same way.
 *
 * BE contract: adminTypeDefs.ts §AdminSession.
 */

const ADMIN_SESSION = graphql(`
  query AdminSession {
    adminSession {
      _id
      userName
      email
      role
      isCSManager
      canRouteTickets
      canManageAllTickets
      canDecideTicketRouting
      permissions
    }
  }
`);

export const adminSessionKeys = {
  all: ["admin-session"] as const,
};

export function useAdminSession() {
  const query = useQuery({
    queryKey: adminSessionKeys.all,
    queryFn: () => execute(ADMIN_SESSION, {}),
    select: (data) => data.adminSession,
    // Standing changes rarely and every gate is re-checked server-side, so this
    // is cached hard rather than refetched on every mount.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    session: query.data ?? null,
    /**
     * Every one of these defaults to false while the session loads, on purpose:
     * the restricted controls stay hidden and then appear, rather than flashing
     * up and being taken away.
     */
    isCSManager: query.data?.isCSManager ?? false,
    canRouteTickets: query.data?.canRouteTickets ?? false,
    canManageAllTickets: query.data?.canManageAllTickets ?? false,
    canDecideTicketRouting: query.data?.canDecideTicketRouting ?? false,
    isLoading: query.isLoading,
  };
}
