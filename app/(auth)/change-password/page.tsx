"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { ChangePasswordForm, useAdminMe } from "@/features/auth";
import { isAuthenticated } from "@/lib/utils/cookies";

/**
 * Lives in the (auth) group rather than (dashboard): an admin reaching this
 * screen because of `must_change_password` cannot open a single dashboard
 * route, so rendering the sidebar around it would be misleading.
 *
 * `useAdminMe` re-hydrates the store on a cold load, so the form knows whether
 * this is the forced first-login case or a voluntary change.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  useAdminMe();

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/signin");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="mb-6 w-36">
        <Image src="/logo.svg" alt="Abode Logo" width={193} height={46} priority />
      </div>

      <ChangePasswordForm />
    </div>
  );
}
