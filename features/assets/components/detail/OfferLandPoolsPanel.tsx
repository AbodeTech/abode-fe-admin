"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import { useLandConfiguration } from "../../hooks/use-land-configuration";
import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { productCapacity, type LandConfigurationProduct } from "../../schemas/land-configuration.schema";
import { DetailPanel } from "./DetailPanel";

const HEAD = "whitespace-nowrap border-b px-2.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";
const CELL = "whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums";

function poolStatus(product: LandConfigurationProduct): { label: string; tone: "good" | "bad" | "neutral" } {
  const { unconfiguredSqm, isOverCapacity } = productCapacity(product);
  if (isOverCapacity) return { label: `Over pool by ${Math.abs(unconfiguredSqm).toLocaleString()} sqm`, tone: "bad" };
  // A product that takes no sizes (Developer Plot) is sold straight from its pool.
  if (!product.takes_sizes) return { label: "Sold from pool", tone: "neutral" };
  if (unconfiguredSqm === 0) return { label: "Fully configured", tone: "good" };
  return { label: "Within pool", tone: "good" };
}

/**
 * Offer land pools — the area control that sits above the offer cards.
 *
 * One row per product, all from GET .../land-configuration:
 *  - Assigned sqm    the product's pool, set in the land account (Overview).
 *  - Configured sqm  how much of that pool is divided into sizes on this tab
 *                    (each size's `size_sqm x configured units`, summed).
 *  - Unconfigured    assigned minus configured — land the product owns but
 *                    can't sell by size yet. Negative means the sizes add up
 *                    to more land than the pool holds ("Over pool").
 *  - Unit capacity   total configured units across the product's sizes.
 *
 * Assigned sqm is deliberately not editable here: it has one home, the land
 * account editor, so the two can never drift apart.
 */
export function OfferLandPoolsPanel({ assetId, action }: { assetId: string; action?: React.ReactNode }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_assets");
  const { data, isLoading } = useLandConfiguration(assetId, { enabled: canView });

  if (!canView) return null;

  const products = data && data.state !== "not_configured" ? data.products : [];

  return (
    <DetailPanel
      title="Offer land pools"
      description="Land assigned to each product, and how much of it is divided into sizes below"
      action={action}
      flush
    >
      {isLoading ? (
        <div className="p-4">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : products.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No land is assigned to a product yet.{" "}
          <Link href={`/assets/${assetId}`} className="underline underline-offset-4">
            Set up the land account on Overview
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className={cn(HEAD, "text-left")}>Offer</th>
                  <th className={cn(HEAD, "text-right")}>Assigned sqm</th>
                  <th className={cn(HEAD, "text-right")}>Configured sqm</th>
                  <th className={cn(HEAD, "text-right")}>Unconfigured</th>
                  <th className={cn(HEAD, "text-right")}>Unit capacity</th>
                  <th className={cn(HEAD, "text-right")}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const { unconfiguredSqm } = productCapacity(product);
                  const status = poolStatus(product);
                  const units = product.sizes.reduce((sum, size) => sum + size.configured_units, 0);
                  return (
                    <tr key={product.offer_type} className="border-b last:border-b-0 hover:bg-muted/40">
                      <td className="whitespace-nowrap px-2.5 py-2.5 font-semibold">
                        {OFFER_TYPE_LABELS[product.offer_type]}
                      </td>
                      <td className={CELL}>{product.assigned_sqm.toLocaleString()}</td>
                      <td className={CELL}>{product.takes_sizes ? product.configured_sqm.toLocaleString() : "—"}</td>
                      <td className={cn(CELL, unconfiguredSqm < 0 && "font-semibold text-rose-600")}>
                        {!product.takes_sizes || unconfiguredSqm === 0 ? "—" : unconfiguredSqm.toLocaleString()}
                      </td>
                      <td className={CELL}>{product.takes_sizes ? units.toLocaleString() : "—"}</td>
                      <td className={CELL}>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[10px] font-semibold",
                            status.tone === "good" && "bg-emerald-500/10 text-emerald-600",
                            status.tone === "bad" && "bg-rose-500/10 text-rose-600",
                            status.tone === "neutral" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">
            Assigned sqm is changed in the{" "}
            <Link href={`/assets/${assetId}`} className="underline underline-offset-4">
              land account on Overview
            </Link>
            ; sizes and units are changed on the cards below.
          </p>
        </>
      )}
    </DetailPanel>
  );
}
