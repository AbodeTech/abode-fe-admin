"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * For a whole tab whose real backend route was confirmed live not to exist at
 * all (not a permission gate, not a temporary outage) — see
 * docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md for what was checked and where.
 * Shown only outside mock mode; in mock mode the tab's real (mock) content
 * renders as normal.
 */
export function BackendGapNotice({ feature }: { feature: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="font-medium">{feature} isn&apos;t available yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          No real backend endpoint exists for this on staging — confirmed live, not a permission or loading issue.
          See docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md for details.
        </p>
      </CardContent>
    </Card>
  );
}
