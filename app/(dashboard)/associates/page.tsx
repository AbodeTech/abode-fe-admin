"use client";

import { useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  useTopAssociates,
  DEFAULT_TOP_ASSOCIATES_LIMIT,
  DEFAULT_TOP_ASSOCIATES_SORT,
} from "@/features/associates";
import { TopAssociatesHeader, AssociateSortKey } from "@/features/associates";
import { TopAssociatesTable } from "@/features/associates";
import { Pagination } from "@/components/shared/Pagination";

const ASSOCIATE_SORT_KEYS: AssociateSortKey[] = [
  "sales_person",
  "no_of_clients",
  "units_sold",
  "size_sold",
  "expected_revenue",
  "received_revenue",
  "commission",
  "collection_rate",
];

const parseSort = (value?: string | null) => {
  const fallback = DEFAULT_TOP_ASSOCIATES_SORT;
  const raw = value || fallback;
  const [rawKey, rawDirection] = raw.split(":");
  const fallbackKey = fallback.split(":")[0] as AssociateSortKey;
  const key = ASSOCIATE_SORT_KEYS.includes(rawKey as AssociateSortKey)
    ? (rawKey as AssociateSortKey)
    : fallbackKey;
  const direction = (rawDirection === "asc" || rawDirection === "desc"
    ? rawDirection
    : "desc") as "asc" | "desc";
  return {
    sortKey: key,
    sortDirection: direction,
    sortParam: `${key}:${direction}`,
  };
};

function TopAssociatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const { sortKey, sortDirection, sortParam } = parseSort(searchParams.get("sort"));
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const assetType = searchParams.get("assettype") || null;
  const assetName = searchParams.get("assetname") || null;

  const { data, isLoading, error } = useTopAssociates({
    page,
    limit: DEFAULT_TOP_ASSOCIATES_LIMIT,
    sortBy: sortParam,
    startDate,
    endDate,
    assetType,
    assetName,
  });

  const rows = useMemo(
    () => (data?.data ?? []).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [data?.data]
  );

  const updateParams = (next: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (key: AssociateSortKey, direction: "asc" | "desc") => {
    updateParams({ sort: `${key}:${direction}`, page: 1 });
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading top associates</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopAssociatesHeader
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      {isLoading ? (
        <TopAssociatesTable isLoading />
      ) : (
        <TopAssociatesTable data={rows} />
      )}

      <Pagination count={data?.count ?? 0} currentIdx={page} limit={DEFAULT_TOP_ASSOCIATES_LIMIT} />

      {isLoading && (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading associates...
        </div>
      )}
    </div>
  );
}

export default function TopAssociatesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TopAssociatesContent />
    </Suspense>
  );
}
