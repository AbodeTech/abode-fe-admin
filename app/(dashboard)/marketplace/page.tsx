"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
    } catch (error: any) {
      toast.error(error.message || "Failed to unsuspend listing");
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
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
      </div>

      {/* Stats */}
      <MarketplaceDataPoints data={statsQuery.data} isLoading={statsQuery.isLoading} />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSearchParam("tab", "listings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "listings"
              ? "border-[#00695C] text-[#00695C]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Listings
        </button>
        <button
          onClick={() => setSearchParam("tab", "approvals")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "approvals"
              ? "border-[#00695C] text-[#00695C]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Approvals
          {(statsQuery.data?.pending_approval_listings || 0) > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              {statsQuery.data?.pending_approval_listings}
            </span>
          )}
        </button>
      </div>

      {/* All Listings Tab */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={status || ""}
              onChange={(e) => setSearchParam("status", e.target.value || null)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
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
              className="border rounded-lg px-3 py-2 text-sm bg-white"
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
            <div className="flex justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParam("page", String(page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {listingsQuery.data.pagination.currentPage} of{" "}
                {listingsQuery.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParam("page", String(page + 1))}
                disabled={page >= listingsQuery.data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === "approvals" && (
        <PendingApprovalsTable
          data={pendingQuery.data?.listings}
          isLoading={pendingQuery.isLoading}
          onApprove={(listing) => setApproveListing(listing)}
          onReject={(listing) => setRejectListing(listing)}
        />
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
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
