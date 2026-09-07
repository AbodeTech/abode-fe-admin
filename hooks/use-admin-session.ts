"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

/**
 * Who the signed-in admin is, and what they may be shown.
 *
 * Two separate facts, and they gate different things:
 *   isCSManager      may they decide routing — classification, ownership,
 *                    grouping, collaborators, resolution — on a ticket.
 *   canRouteTickets  do they also SEE the unassigned pool. True only for a CS
 *                    Manager whose role is "admin"; they are the one who hands
 *                    new tickets out.
 *
 * Both come from the server rather than being derived here from role +
 * isCSManager, so the rule has one definition and this cannot drift from what
 * the scoping actually does.
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
     * Undefined-safe on purpose: while the session is loading nobody is a CS
     * Manager, so the restricted controls stay hidden and then appear, rather
     * than flashing up and being taken away.
     */
    isCSManager: query.data?.isCSManager ?? false,
    canRouteTickets: query.data?.canRouteTickets ?? false,
    isLoading: query.isLoading,
  };
}
