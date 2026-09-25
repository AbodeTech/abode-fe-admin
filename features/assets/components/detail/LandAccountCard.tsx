"use client";

import { History, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatSqm } from "@/lib/utils/format";

import { useLandConfiguration } from "../../hooks/use-land-configuration";

interface MetricProps {
  label: string;
  value: string;
  sub?: string;
  dot: string;
  variant?: "neutral" | "warning";
}

function Metric({ label, value, sub, dot, variant = "neutral" }: MetricProps) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot)} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-lg font-bold tabular-nums">{value}</span>
          {sub ? (
            <span
              className={cn(
                "text-xs font-medium",
                variant === "warning" ? "text-amber-600" : "text-muted-foreground"
              )}
            >
              {sub}
            </span>
          ) : null}
        </p>
      </div>
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
 * services, unclassified. Renders one of three honest states: not yet
 * configured (a legacy asset), or the full bar once `total_land_sqm` exists.
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

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Land account</h2>
          <p className="text-xs text-muted-foreground">
            Every sqm of the estate, from physical land to saleable product pools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewHistory}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            View history
          </Button>
          {canManage ? (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit breakdown
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-2 border-b pb-3">
          <span className="text-xs text-muted-foreground">Total estate size</span>
          <span className="text-lg font-bold tabular-nums">{formatSqm(total)}</span>
        </div>

        <div
          className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(productPct + nonSaleablePct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Estate land reconciliation: saleable products, roads and services, unclassified"
        >
          <div className="h-full bg-emerald-500" style={{ width: `${productPct}%` }} />
          <div className="h-full bg-amber-400" style={{ width: `${nonSaleablePct}%` }} />
          <div className="h-full bg-rose-400" style={{ width: `${unclassifiedPct}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
          <Metric
            label="Saleable products"
            value={formatSqm(data.saleable_assigned_sqm)}
            sub={`${productPct.toFixed(1)}% of estate`}
            dot="bg-emerald-500"
          />
          <Metric
            label="Roads & services"
            value={formatSqm(data.non_saleable_sqm)}
            sub={`${nonSaleablePct.toFixed(1)}% of estate`}
            dot="bg-amber-400"
          />
          <Metric
            label="Unclassified"
            value={formatSqm(data.unclassified_sqm)}
            sub={data.unclassified_sqm ? `${unclassifiedPct.toFixed(1)}% of estate` : "Fully assigned"}
            dot="bg-rose-400"
            variant={data.unclassified_sqm ? "warning" : "neutral"}
          />
        </div>

        {data.warnings.length > 0 ? (
          <div className="mt-4 space-y-1 rounded-lg border border-rose-200 bg-rose-500/5 p-3 text-xs text-rose-600">
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        Version {data.version} — total, product pools, and roads &amp; services are entered here; see
        Roads &amp; Services below for the named breakdown.
      </div>

      {data.inventory_model_version === "legacy_units" ? (
        <div className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:px-6">
          Legacy unit inventory (below) is still what sells this asset today — this sqm account
          is planning data until the live inventory ledger activates.
        </div>
      ) : null}
    </section>
  );
}
