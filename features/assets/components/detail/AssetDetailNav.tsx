"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * Tabs as sub-routes rather than client state, so a link to a specific view
 * works and the back button steps through tabs correctly. React Query dedupes
 * the asset fetch across them, so this costs no extra requests.
 */
const TABS = [
  { segment: "", label: "Overview" },
  { segment: "offers", label: "Offers" },
  // The land itself — blocks and plots. Named for what it manages, because the
  // sidebar's "Allocation" is the other half: handing these plots to a buyer.
  { segment: "blocks", label: "Blocks & Plots" },
  { segment: "site-setup", label: "Site Setup" },
  { segment: "costs", label: "Costs & Profitability" },
  // These three call real-backend routes confirmed live not to exist at all —
  // see docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md. Hidden from the nav
  // outside mock mode rather than linking to a tab that can only ever error.
  { segment: "performance", label: "Performance", mockOnly: true },
  { segment: "customers", label: "Customers", mockOnly: true },
  { segment: "updates", label: "Updates", mockOnly: true },
] as const;

export function AssetDetailNav({ assetId }: { assetId: string }) {
  const pathname = usePathname();
  const base = `/assets/${assetId}`;
  const showMockOnly = isMockApiEnabled();
  const tabs = TABS.filter((tab) => !("mockOnly" in tab && tab.mockOnly) || showMockOnly);

  return (
    <nav className="-mb-px flex min-w-0 gap-1 overflow-x-auto border-b" aria-label="Asset sections">
      {tabs.map((tab) => {
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
          </Link>
        );
      })}
    </nav>
  );
}
