"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageContentLoader } from "@/components/shared/page-content-loader";

import { availableUnits } from "../../schemas/asset.schema";
import { useAssetDetail } from "../../hooks/use-asset-detail";
import { AssetStatusBadges } from "../list/AssetStatusBadges";
import { AssetDetailNav } from "./AssetDetailNav";

/**
 * Header, inventory summary and tab nav — shared by all four sub-routes.
 *
 * This calls `useAssetDetail` and so does each page beneath it. That is not a
 * duplicate request: React Query resolves both from one cache entry keyed
 * `['assets','detail',id]`. Don't "optimise" it into a context provider —
 * the cache is already doing that job, and props would force every tab to
 * re-render when any of them refetches.
 */
export function AssetDetailShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const assetId = params.id;

  const { data: asset, isLoading, error } = useAssetDetail(assetId);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col px-3 sm:px-4">
        <PageContentLoader label="Loading asset…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading asset</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  const available = availableUnits(asset);
  const allocated = asset.sales_cap > 0 ? 1 - available / asset.sales_cap : 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-5 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="space-y-2">
        <Link
          href="/assets"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to assets
        </Link>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight wrap-break-word">{asset.name}</h1>
            {asset.asset_location ? (
              <p className="text-muted-foreground">{asset.asset_location}</p>
            ) : null}
          </div>

          <AssetStatusBadges
            visibility={asset.visibility}
            sold={asset.sold}
            deletedAt={asset.deleted_at}
            className="shrink-0"
          />
        </div>
      </div>

      {/* Real data — the counters are asset fields and available_units is a
          backend virtual. Nothing here is sample. */}
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium tabular-nums">
            {available.toLocaleString()}{" "}
            <span className="font-normal text-muted-foreground">
              of {asset.sales_cap.toLocaleString()} units available
            </span>
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {asset.sold_units.toLocaleString()} sold
            {asset.reserved_units > 0
              ? ` · ${asset.reserved_units.toLocaleString()} reserved`
              : ""}
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/60"
            style={{ width: `${Math.min(100, Math.max(0, allocated * 100))}%` }}
          />
        </div>
      </div>

      <AssetDetailNav assetId={assetId} />

      <div className="min-w-0">{children}</div>
    </div>
  );
}
