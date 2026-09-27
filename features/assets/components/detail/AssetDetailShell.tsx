"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { AssetStatusBadges } from "../list/AssetStatusBadges";
import { AssetDetailNav } from "./AssetDetailNav";
import { AssetInventoryHeaderSummary } from "./AssetInventoryHeaderSummary";

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

      {/* Real data throughout — legacy counters are asset fields and
          available_units is a backend virtual; the sqm side, when present,
          comes from GET .../land-configuration. Nothing here is sample, and
          the two models are never blended into one figure. */}
      <AssetInventoryHeaderSummary asset={asset} />

      <AssetDetailNav assetId={assetId} />

      <div className="min-w-0">{children}</div>
    </div>
  );
}
