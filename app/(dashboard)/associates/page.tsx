"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  DEFAULT_LEADERBOARD_LIMIT,
  LEADERBOARD_ASSET_TYPES,
  LEADERBOARD_TIERS,
  TopAssociatesHeader,
  TopAssociatesTable,
  useTopAssociates,
  useTopAssociatesExport,
  type AssociateSortField,
  type LeaderboardAssetType,
  type LeaderboardTier,
  type SortDirection,
  type TopAssociateFilters,
} from "@/features/associates";
import { ASSOCIATE_SORT_FIELDS } from "@/features/associates";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function TopAssociatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sortBy =
    parseEnum<AssociateSortField>(searchParams.get("sort_by"), ASSOCIATE_SORT_FIELDS) ??
    "commission";
  const sortDir: SortDirection = searchParams.get("sort_dir") === "asc" ? "asc" : "desc";

  const filters: TopAssociateFilters = {
    start_date: searchParams.get("start_date") ?? undefined,
    end_date: searchParams.get("end_date") ?? undefined,
    asset_type: parseEnum<LeaderboardAssetType>(
      searchParams.get("asset_type"),
      LEADERBOARD_ASSET_TYPES
    ),
    referral_status: parseEnum<LeaderboardTier>(
      searchParams.get("referral_status"),
      LEADERBOARD_TIERS
    ),
    include_suspended: searchParams.get("include_suspended") === "true",
    sort_by: sortBy,
    sort_dir: sortDir,
  };

  const { data, isLoading, isFetching, error } = useTopAssociates({ ...filters, page });
  const { mutateAsync: exportLeaderboard, isPending: isExporting } = useTopAssociatesExport();

  const rows = data?.items ?? [];

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (key: AssociateSortField, direction: SortDirection) =>
    setParams({ sort_by: key, sort_dir: direction, page: "1" });

  const handleExport = async () => {
    try {
      await exportLeaderboard(filters);
      toast.success("Leaderboard exported.");
    } catch (err) {
      const message = (err as Error).message || "";
      if (/EXPORT_TOO_LARGE|too many rows/i.test(message)) {
        toast.error("Too many rows to export — narrow by tier, asset type or date range.");
      } else {
        toast.error(message || "Failed to export the leaderboard.");
      }
    }
  };

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading top associates</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  // The BE's `{ count, data }` loses its count to the response envelope, so
  // there is no total to page against. Until it returns `meta.total`, Next is
  // driven by whether a full page came back — swap this for <Pagination /> the
  // moment the total arrives.
  const hasNextPage = rows.length === DEFAULT_LEADERBOARD_LIMIT;
  const firstRank = (page - 1) * DEFAULT_LEADERBOARD_LIMIT;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <TopAssociatesHeader
        sortKey={sortBy}
        sortDirection={sortDir}
        onSortChange={handleSortChange}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <TopAssociatesTable data={rows} isLoading={isLoading} rankOffset={firstRank} />

      {rows.length > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            Showing {firstRank + 1}&ndash;{firstRank + rows.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isFetching}
              onClick={() => setParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage || isFetching}
              onClick={() => setParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TopAssociatesPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <TopAssociatesContent />
    </Suspense>
  );
}
