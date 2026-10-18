"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { OFFER_TYPE_LABELS, VISIBILITY_LABELS, type OfferType } from "../../schemas/asset.schema";
import type { CreateAssetFormValues } from "../../schemas/create-asset.schema";
import { totalAssignedSqm, unclassifiedSqm } from "../../schemas/land-configuration.schema";

/**
 * A compact, read-only summary shown just above the submit action — nothing
 * here is authoritative. The server response after Create asset is.
 */
export function ReviewAndCreateSection() {
  const { control } = useFormContext<CreateAssetFormValues>();
  const values = useWatch({ control });

  const total = Number(values.total_land_sqm) || 0;
  const pools = (values.product_pools ?? [])
    .filter((pool): pool is { offer_type: OfferType; assigned_sqm?: number } =>
      Boolean(pool?.offer_type)
    )
    .map((pool) => ({ offer_type: pool.offer_type, assigned_sqm: Number(pool.assigned_sqm) || 0 }));
  const assigned = totalAssignedSqm(pools);
  const remainder = Math.max(0, unclassifiedSqm(total, pools));

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-medium">{values.name?.trim() || "Untitled asset"}</p>
        <p className="text-xs text-muted-foreground">
          {values.asset_location?.trim() || "No location set"}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Total estate size</dt>
          <dd className="font-medium tabular-nums">{total.toLocaleString()} sqm</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Assigned to products</dt>
          <dd className="font-medium tabular-nums">{assigned.toLocaleString()} sqm</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Unclassified</dt>
          <dd className="font-medium tabular-nums">{remainder.toLocaleString()} sqm</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Visibility</dt>
          <dd className="font-medium">
            {VISIBILITY_LABELS[values.visibility ?? "draft"]}
          </dd>
        </div>
      </dl>

      {pools.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {pools.map((pool) => (
            <li key={pool.offer_type}>
              {OFFER_TYPE_LABELS[pool.offer_type]} — {pool.assigned_sqm.toLocaleString()} sqm
            </li>
          ))}
        </ul>
      ) : null}

      <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        Roads, services, sizes, and prices can be completed after the asset is created. Until then it
        stays non-purchasable — this does not mean it&apos;s sold out.
      </p>
    </div>
  );
}
