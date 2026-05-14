"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
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
import type { MarketplaceListingAdmin } from "@/features/marketplace";

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") || "listings";
  const page = Number(searchParams.get("page") || "1");
  const status = searchParams.get("status") || undefined;
  const assetType = searchParams.get("asset_type") || undefined;

  // Dialog state
  const [suspendListing, setSuspendListing] = useState<MarketplaceListingAdmin | null>(null);
  const [approveListing, setApproveListing] = useState<MarketplaceListingAdmin | null>(null);
  const [rejectListing, setRejectListing] = useState<MarketplaceListingAdmin | null>(null);

  // Queries
  const statsQuery = useMarketplaceStats();
  const listingsQuery = useMarketplaceListings({
    page,
    limit: 20,
    status,
    asset_type: assetType,
  });
  const pendingQuery = usePendingApprovals({ page, limit: 20 });
  const unsuspendMutation = useUnsuspendListing();

  const handleUnsuspend = async (listing: MarketplaceListingAdmin) => {
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
          {(statsQuery.data?.pending_approval_listings || 0) > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              {statsQuery.data?.pending_approval_listings}
            </span>
          )}
        </button>
      </div>

      {activeTab === "listings" && (
        <div className="min-w-0 space-y-4">
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

            <select
              value={assetType || ""}
              onChange={(e) => setSearchParam("asset_type", e.target.value || null)}
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm sm:h-auto sm:min-w-40 sm:w-auto"
            >
              <option value="">All Types</option>
              <option value="flex">Flex</option>
              <option value="full-ownership">Full Ownership</option>
              <option value="co-ownership">Co-Ownership</option>
              <option value="land-banking">Land Banking</option>
            </select>
          </div>

          {/* Table */}
          <MarketplaceListingsTable
            data={listingsQuery.data?.listings}
            isLoading={listingsQuery.isLoading}
            onSuspend={(listing) => setSuspendListing(listing)}
            onUnsuspend={handleUnsuspend}
          />

          {/* Pagination */}
          {listingsQuery.data?.pagination && listingsQuery.data.pagination.totalPages > 1 && (
            <div className="flex flex-col items-stretch gap-2 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSearchParam("page", String(page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center justify-center px-3 text-sm text-gray-600">
                Page {listingsQuery.data.pagination.currentPage} of{" "}
                {listingsQuery.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSearchParam("page", String(page + 1))}
                disabled={page >= listingsQuery.data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="min-w-0 space-y-4">
          <PendingApprovalsTable
            data={pendingQuery.data?.listings}
            isLoading={pendingQuery.isLoading}
            onApprove={(listing) => setApproveListing(listing)}
            onReject={(listing) => setRejectListing(listing)}
          />
          {pendingQuery.data?.pagination && pendingQuery.data.pagination.totalPages > 1 && (
            <div className="flex flex-col items-stretch gap-2 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSearchParam("page", String(page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center justify-center px-3 text-sm text-gray-600">
                Page {pendingQuery.data.pagination.currentPage} of{" "}
                {pendingQuery.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSearchParam("page", String(page + 1))}
                disabled={page >= pendingQuery.data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
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
