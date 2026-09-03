"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  AssetCategoryHealth,
  AssetFilters,
  AssetsTable,
  DeleteAssetDialog,
  DEFAULT_ASSET_LIMIT,
  InventoryHealthBar,
  useAssetList,
  usePortfolioAnalytics,
  type Asset,
  type OfferType,
  type Visibility,
} from "@/features/assets";

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function AssetsPageContent() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? undefined;
  const visibility = (searchParams.get("visibility") as Visibility) ?? undefined;
  const offerType = (searchParams.get("offer_type") as OfferType) ?? undefined;
  const sold = searchParams.get("sold") === "true";
  const includeDeleted = searchParams.get("include_deleted") === "true";

  const [deleting, setDeleting] = useState<Asset | null>(null);

  const { data, isLoading, error } = useAssetList({
    page,
    limit: DEFAULT_ASSET_LIMIT,
    search,
    visibility,
    offer_type: offerType,
    sold,
    include_deleted: includeDeleted,
  });

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const hasFilters = Boolean(search || visibility || offerType || sold || includeDeleted);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading assets</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AssetFilters />

      <AssetsTable
        rows={rows}
        isLoading={isLoading}
        onDelete={setDeleting}
        emptyState={
          hasFilters ? (
            <EmptyState
              title="No assets match these filters"
              body="Clear or widen the filters to see the rest of the catalogue."
            />
          ) : (
            <EmptyState
              title="No assets yet"
              body="Create one to start selling flex, full-ownership or commercial plots."
            />
          )
        }
      />

      <Pagination count={total} currentIdx={page} limit={DEFAULT_ASSET_LIMIT} />

      <DeleteAssetDialog
        asset={deleting}
        onOpenChange={(next) => (next ? undefined : setDeleting(null))}
      />
    </div>
  );
}

function PortfolioAnalyticsPanels() {
  const { data, isLoading, error } = usePortfolioAnalytics();

  if (isLoading) {
    return (
      <div className="mb-6 h-40 w-full animate-pulse rounded-xl border bg-muted/30 sm:mb-8" />
    );
  }

  if (error || !data) {
    return (
      <div className="mb-6 rounded-md border border-dashed p-4 text-sm text-muted-foreground sm:mb-8">
        Portfolio analytics are unavailable right now.
      </div>
    );
  }

  return (
    <>
      <InventoryHealthBar data={data.portfolio} />
      <AssetCategoryHealth data={data.categories} />
    </>
  );
}

export default function AssetsPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Every property in the catalogue. An asset can sell flex, full ownership, or both — the
            offers column shows which.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/assets/create">
              <Plus className="mr-2 h-4 w-4" />
              New asset
            </Link>
          </Button>
        </div>
      </div>

      <PortfolioAnalyticsPanels />

      <Suspense fallback={<PageContentLoader label="Loading assets…" />}>
        <AssetsPageContent />
      </Suspense>
    </div>
  );
}
