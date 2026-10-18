import type { Metadata } from "next";
import Image from "next/image";

import { MaintenanceNotice } from "@/features/auth";

export const metadata: Metadata = {
  title: "Under maintenance",
};

/**
 * Where middleware.ts sends every request while MAINTENANCE_MODE is on. With
 * it off, middleware redirects this page home, so it can't be reached by
 * accident.
 */
export default function MaintenancePage() {
  return (
    <div data-maintenance className="flex flex-col items-center justify-center pt-9 text-center">
      <div className="mb-6 w-36 mx-auto">
        <Image
          src="/logo.svg"
          alt="Abode Logo"
          width={193}
          height={46}
          priority
        />
      </div>
      <MaintenanceNotice />
    </div>
  );
}
