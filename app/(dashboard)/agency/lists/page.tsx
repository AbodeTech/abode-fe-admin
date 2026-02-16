"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import {
  AgencyListFilters,
  AgencyListTable,
  AgencySystemMetrics,
  DEFAULT_AGENCY_LIMIT,
  useAgencies,
} from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

function AgencyListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const queryParam = searchParams.get("query") || "";
  const [query, setQuery] = useState(queryParam);

  const { data, isLoading, error } = useAgencies({
    page,
    limit: DEFAULT_AGENCY_LIMIT,
    searchQuery: queryParam || null,
  });

  const updateParams = useCallback(
    (next: Record<string, string | number | null | undefined>, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const qs = params.toString();
      const url = qs ? `?${qs}` : "";
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== queryParam) {
        updateParams({ query: query || null, page: 1 }, { replace: true });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, queryParam, updateParams]);

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading agencies</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agencies</h1>
          <p className="text-muted-foreground">Manage agency partners and view their performance.</p>
        </div>
        <Button asChild>
          <Link href="/agency/new">
            <Plus className="h-4 w-4 mr-2" />
            Onboard Agency
          </Link>
        </Button>
      </div>

      <AgencyListFilters search={query} onSearchChange={setQuery} />

      <AgencySystemMetrics data={data?.dashboard} />

      <AgencyListTable rows={data?.agencies} isLoading={isLoading} />

      <Pagination
        count={data?.count ?? 0}
        currentIdx={data?.currentPage ?? page}
        limit={DEFAULT_AGENCY_LIMIT}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading agencies...
        </div>
      )}
    </div>
  );
}

export default function AgencyListPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AgencyListContent />
    </Suspense>
  );
}
