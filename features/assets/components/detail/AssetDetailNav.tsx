"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Tabs as sub-routes rather than client state, so a link to a specific view
 * works and the back button steps through tabs correctly. React Query dedupes
 * the asset fetch across them, so this costs no extra requests.
 */
const TABS = [
  { segment: "", label: "Overview" },
  { segment: "offers", label: "Offers" },
  { segment: "performance", label: "Performance", sample: true },
  { segment: "customers", label: "Customers", sample: true },
] as const;

export function AssetDetailNav({ assetId }: { assetId: string }) {
  const pathname = usePathname();
  const base = `/assets/${assetId}`;

  return (
    <nav className="-mb-px flex min-w-0 gap-1 overflow-x-auto border-b" aria-label="Asset sections">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = tab.segment
          ? pathname.startsWith(href)
          : pathname === base || pathname === `${base}/`;

        return (
          <Link
            key={tab.segment || "overview"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {/* Marks tabs whose data is fabricated or absent — see tickets 17b/17c. */}
            {"sample" in tab && tab.sample ? (
              <FlaskConical className="h-3 w-3 opacity-60" aria-label="Sample data" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
