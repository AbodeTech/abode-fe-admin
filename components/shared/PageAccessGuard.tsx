"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { NoAccess } from "@/components/shared/NoAccess";
import { usePageAccess, useStartRoute } from "@/hooks/use-access";
import { useAuthStore } from "@/store/auth-store";
import { findPage } from "@/lib/rbac";

/**
 * Wraps dashboard content. If the registry says the signed-in admin may not
 * open this route, shows the No-access state instead of a page of failed
 * requests.
 *
 * Usability, not security: the server answers 403 to the same request, and a
 * path the registry does not know is let through for the server to judge.
 * While a manager or officer lookup could still grant the page, it waits
 * rather than flashing "restricted" at someone who is about to be let in.
 */
export function PageAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { entry, allowed, pending } = usePageAccess(pathname);
  const user = useAuthStore((state) => state.user);
  const startRoute = useStartRoute();

  // "/" is where an already-signed-in admin lands when they open the site or
  // follow a bookmark. If they may not open the dashboard, send them to their
  // own start page instead of showing a lock on the front door.
  const bounceToStart = !!user && !allowed && !pending && pathname === "/" && startRoute !== "/";

  useEffect(() => {
    if (bounceToStart) router.replace(startRoute);
  }, [bounceToStart, router, startRoute]);

  // On a hard load the stored session is not in memory for a moment (the
  // session gate is still fetching GET /auth/admin/me). An empty session holds
  // no permission, so judging it would flash "restricted" on pages the person
  // may open. Wait for the session instead; the gate sends a dead one to /signin.
  if (!user && !allowed) return <PageContentLoader label="Loading…" />;

  if (allowed) return <>{children}</>;
  if (pending) return <PageContentLoader label="Checking access…" />;
  if (bounceToStart) return <PageContentLoader label="Opening your start page…" />;

  const roleNames = [user?.role, ...(user?.additional_roles ?? [])]
    .map((role) => role?.name)
    .filter((name): name is string => !!name);

  return (
    <NoAccess
      pageLabel={entry?.label}
      note={entry?.recordNote}
      roleNames={roleNames}
      homeHref={startRoute}
      homeLabel={findPage(startRoute)?.label}
    />
  );
}
