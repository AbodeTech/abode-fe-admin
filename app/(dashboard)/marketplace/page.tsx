"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { toast } from "sonner";
import {
  DEFAULT_MARKETPLACE_LISTINGS_LIMIT,
  useMarketplaceListings,
  usePendingApprovals,
  useMarketplaceStats,
  useUnsuspendListing,
  MarketplaceDataPoints,
  MarketplaceListingsTable,
  PendingApprovalsTable,
  MarketplaceSuspendDialog,
  MarketplaceApproveDialog,
  MarketplaceRejectDialog,
} from "@/features/marketplace";
import type { MarketplaceListing } from "@/features/marketplace";

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") || "listings";
  const page = Number(searchParams.get("page") || "1");
  const status = searchParams.get("status") || undefined;

  // Dialog state
  const [suspendListing, setSuspendListing] = useState<MarketplaceListing | null>(null);
  const [approveListing, setApproveListing] = useState<MarketplaceListing | null>(null);
  const [rejectListing, setRejectListing] = useState<MarketplaceListing | null>(null);

  // Queries
  const statsQuery = useMarketplaceStats();
  const listingsQuery = useMarketplaceListings({
    page,
    limit: DEFAULT_MARKETPLACE_LISTINGS_LIMIT,
    status,
  });
  const pendingQuery = usePendingApprovals({ page, limit: DEFAULT_MARKETPLACE_LISTINGS_LIMIT });
  const unsuspendMutation = useUnsuspendListing();

  const handleUnsuspend = async (listing: MarketplaceListing) => {
    try {
      await unsuspendMutation.mutateAsync(listing._id);
      toast.success("Listing unsuspended");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to unsuspend listing");
    }
  };

  const setSearchParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  };

  const listings = listingsQuery.data?.items ?? [];
  const listingsCount = listingsQuery.data?.meta.total ?? 0;
  const pending = pendingQuery.data?.items ?? [];
  const pendingCount = pendingQuery.data?.meta.total ?? 0;
  const byStatus = statsQuery.data?.by_status ?? {};

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Marketplace</h2>
      </div>

      <MarketplaceDataPoints data={statsQuery.data} isLoading={statsQuery.isLoading} />

      <div className="flex min-w-0 gap-1 overflow-x-auto border-b pb-px sm:gap-2">
        <button
          type="button"
          onClick={() => setSearchParam("tab", "listings")}
          className={`shrink-0 px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
            activeTab === "listings"
              ? "border-b-2 border-[#00695C] text-[#00695C]"
              : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Listings
        </button>
        <button
          type="button"
          onClick={() => setSearchParam("tab", "approvals")}
          className={`flex shrink-0 items-center gap-1 px-3 py-2 text-sm font-medium transition-colors sm:gap-2 sm:px-4 ${
            activeTab === "approvals"
              ? "border-b-2 border-[#00695C] text-[#00695C]"
              : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="whitespace-nowrap">Pending Approvals</span>
          {(byStatus.pending_approval || 0) > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              {byStatus.pending_approval}
            </span>
          )}
        </button>
      </div>

      {activeTab === "listings" && (
        <div className="min-w-0 space-y-4">
          {/*
            Only `status` is filterable server-side — AdminListingsQueryDto has
            no `asset_type` field, unlike the old GraphQL filter input. Dropped
            rather than sent-and-ignored. See docs/BACKEND-REQUESTS.md #27.
          */}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <select
              value={status || ""}
              onChange={(e) => setSearchParam("status", e.target.value || null)}
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm sm:h-auto sm:min-w-40 sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="sold">Sold</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <MarketplaceListingsTable
            data={listings}
            isLoading={listingsQuery.isLoading}
            onSuspend={(listing) => setSuspendListing(listing)}
            onUnsuspend={handleUnsuspend}
          />

          {listingsCount > DEFAULT_MARKETPLACE_LISTINGS_LIMIT ? (
            <Pagination count={listingsCount} currentIdx={page} limit={DEFAULT_MARKETPLACE_LISTINGS_LIMIT} />
          ) : null}
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="min-w-0 space-y-4">
          <PendingApprovalsTable
            data={pending}
            isLoading={pendingQuery.isLoading}
            onApprove={(listing) => setApproveListing(listing)}
            onReject={(listing) => setRejectListing(listing)}
          />
          {pendingCount > DEFAULT_MARKETPLACE_LISTINGS_LIMIT ? (
            <Pagination count={pendingCount} currentIdx={page} limit={DEFAULT_MARKETPLACE_LISTINGS_LIMIT} />
          ) : null}
        </div>
      )}

      {/* Dialogs */}
      <MarketplaceSuspendDialog
        listingId={suspendListing?._id || null}
        isOpen={!!suspendListing}
        onClose={() => setSuspendListing(null)}
      />
      <MarketplaceApproveDialog
        listing={approveListing}
        isOpen={!!approveListing}
        onClose={() => setApproveListing(null)}
      />
      <MarketplaceRejectDialog
        listing={rejectListing}
        isOpen={!!rejectListing}
        onClose={() => setRejectListing(null)}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <MarketplaceContent />
    </Suspense>
  );
}
