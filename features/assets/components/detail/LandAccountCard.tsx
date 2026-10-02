"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatSqmExact } from "@/lib/utils/format";

import { useLandConfiguration } from "../../hooks/use-land-configuration";
import { DetailPanel } from "./DetailPanel";

function Legend({ label, value, swatch, warn = false }: { label: string; value: string; swatch: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <i className={cn("size-1.75 shrink-0 rounded-[2px]", swatch)} />
        {label}
      </div>
      <strong className={cn("mt-1 block text-[13px] font-semibold tabular-nums", warn && "text-amber-600")}>
        {value}
      </strong>
    </div>
  );
}

interface Props {
  assetId: string;
  onEdit: () => void;
  onViewHistory: () => void;
}

/**
 * The estate-level reconciliation — total, saleable products, roads &
 * services, unclassified — all from GET .../land-configuration. Renders one
 * of two honest states: not yet configured (a legacy asset), or the full bar
 * once `total_land_sqm` exists.
 *
 * "Product pools assigned" reads `assigned / saleable land`, where saleable
 * land is the total minus roads & services. The gap between the two is
 * exactly the unclassified figure above it.
 * Never mixes this sqm figure with the legacy unit counters (`sales_cap` /
 * `sold_units` / `reserved_units`) shown elsewhere on the page.
 */
export function LandAccountCard({ assetId, onEdit, onViewHistory }: Props) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_assets");
  const canManage = permissions.has("manage_assets");
  const { data, isLoading } = useLandConfiguration(assetId, { enabled: canView });

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view the land account.</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can grant the view_assets permission.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-3.5 w-full" />
        <Skeleton className="mt-4 h-10 w-full" />
      </section>
    );
  }

  if (!data) return null;

  if (data.state === "not_configured") {
    return (
      <section className="rounded-xl border p-6 text-center">
        <p className="font-medium">Land account not configured</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          This asset predates the physical-land model. Its legacy unit inventory keeps working
          exactly as before — setting up a land account here doesn&apos;t change that.
        </p>
        {canManage ? (
          <Button className="mt-4" size="sm" onClick={onEdit}>
            Set up land account
          </Button>
        ) : null}
      </section>
    );
  }

  const total = data.total_land_sqm ?? 0;
  const pct = (n: number) => (total > 0 ? Math.max(0, Math.min(100, (n / total) * 100)) : 0);
  const productPct = pct(data.saleable_assigned_sqm);
  const nonSaleablePct = pct(data.non_saleable_sqm);
  const unclassifiedPct = Math.max(0, 100 - productPct - nonSaleablePct);
  // Land that could be sold: everything that isn't a road or a service.
  const saleableLand = total - data.non_saleable_sqm;

  return (
    <DetailPanel
      title="Land account"
      description="Every sqm of the estate, from physical land to saleable product pools"
      action={
        <>
          <Button variant="outline" size="sm" onClick={onViewHistory}>
            View history
          </Button>
          {canManage ? (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit breakdown
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex items-baseline justify-between gap-2 border-b pb-3">
        <span className="text-xs text-muted-foreground">Total estate size</span>
        <strong className="text-lg font-semibold tabular-nums">{formatSqmExact(total)}</strong>
      </div>

      <div
        className="mb-2.5 mt-3.5 flex h-3.5 w-full overflow-hidden rounded bg-muted"
        role="img"
        aria-label={`Saleable products ${productPct.toFixed(1)}%, roads and services ${nonSaleablePct.toFixed(1)}%, unclassified ${unclassifiedPct.toFixed(1)}%`}
      >
        <div className="h-full bg-foreground/75" style={{ width: `${productPct}%` }} />
        <div className="h-full bg-muted-foreground/50" style={{ width: `${nonSaleablePct}%` }} />
        <div className="h-full bg-amber-500" style={{ width: `${unclassifiedPct}%` }} />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Legend
          label="Saleable products"
          swatch="bg-foreground/75"
          value={`${formatSqmExact(data.saleable_assigned_sqm)} · ${productPct.toFixed(1)}%`}
        />
        <Legend
          label="Roads & services"
          swatch="bg-muted-foreground/50"
          value={`${formatSqmExact(data.non_saleable_sqm)} · ${nonSaleablePct.toFixed(1)}%`}
        />
        <Legend
          label="Unclassified"
          swatch="bg-amber-500"
          value={`${formatSqmExact(data.unclassified_sqm)} · ${unclassifiedPct.toFixed(1)}%`}
          warn={data.unclassified_sqm > 0}
        />
      </div>

      <div className="mt-3.5 flex justify-between gap-2.5 border-t pt-3 text-xs">
        <span className="text-muted-foreground">Product pools assigned</span>
        <strong className="font-semibold tabular-nums">
          {data.saleable_assigned_sqm.toLocaleString()} / {formatSqmExact(saleableLand)}
        </strong>
      </div>

      {data.warnings.length > 0 ? (
        <div className="mt-3 space-y-1 rounded-lg border border-rose-200 bg-rose-500/5 p-3 text-xs text-rose-600">
          {data.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {data.inventory_model_version === "legacy_units" ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Legacy unit inventory is still what sells this asset today — this sqm account is planning
          data until the live inventory ledger activates.
        </p>
      ) : null}
    </DetailPanel>
  );
}
