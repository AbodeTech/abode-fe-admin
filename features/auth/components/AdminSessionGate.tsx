"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";
import { isAuthenticated, setMustChangePasswordHint } from "@/lib/utils/cookies";
import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useAdminMe } from "../hooks/use-admin-me";

/**
 * Wraps the dashboard. middleware.ts already turns away visitors with no
 * session cookie and redirects a locked account before anything renders — but
 * it works from cookies alone, and cookies are client-writable.
 *
 * This is the authority behind that hint:
 *
 *  1. **Re-hydrates the session.** On a cold load there is a cookie but no
 *     login response, so the store is empty until GET /auth/admin/me answers.
 *  2. **Corrects the hint cookie.** The server's `must_change_password` is the
 *     real value. If someone edited the cookie — or it went stale — this
 *     rewrites it, and the redirect below still holds the gate.
 *
 * Tampering with the cookie gains nothing either way: the BE 403s every admin
 * route while the lock is set, so a forged hint buys a dashboard of failed
 * requests, not access.
 */
export function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useAdminMe();

  const login = useAuthStore((state) => state.login);
  const storedAdmin = useAuthStore((state) => state.user);

  const serverValue = me.data?.must_change_password;
  const mustChangePassword =
    serverValue ?? storedAdmin?.must_change_password ?? false;

  // Keep the store in step with what the server says.
  useEffect(() => {
    if (me.data) login(me.data);
  }, [me.data, login]);

  // Re-align the middleware hint with the server's answer.
  useEffect(() => {
    if (serverValue === undefined) return;
    setMustChangePasswordHint(serverValue);
  }, [serverValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isAuthenticated()) {
      router.replace("/signin");
      return;
    }

    if (mustChangePassword) {
      router.replace("/change-password");
    }
  }, [mustChangePassword, router]);

  // Don't paint a dashboard the admin is about to be redirected out of — every
  // request it fires would 403 anyway.
  if (mustChangePassword) {
    return <PageContentLoader label="Redirecting…" />;
  }

  return <>{children}</>;
}
