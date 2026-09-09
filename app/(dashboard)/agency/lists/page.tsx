"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  AgencyListFilters,
  AgencyListTable,
  DEFAULT_AGENCY_LIMIT,
  useAgencies,
  type AgencySortField,
  type AgencyStatus,
} from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

const SORT_FIELDS: AgencySortField[] = ["created_at", "name", "commission_percentage"];

function isSortField(value: string | null): value is AgencySortField {
  return !!value && SORT_FIELDS.includes(value as AgencySortField);
}

function isStatus(value: string | null): value is AgencyStatus {
  return value === "active" || value === "suspended";
}

function AgencyListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const queryParam = searchParams.get("query") || "";
  const statusParam = searchParams.get("status");
  const sortParam = searchParams.get("sort");
  const orderParam = searchParams.get("order");

  const status = isStatus(statusParam) ? statusParam : null;
  const sort = isSortField(sortParam) ? sortParam : "created_at";
  const order = orderParam === "asc" ? "asc" : "desc";

  const [query, setQuery] = useState(queryParam);

  const canManage = useHasPermission("manage_agencies");

  const { data, isLoading, error } = useAgencies({
    page,
    limit: DEFAULT_AGENCY_LIMIT,
    q: queryParam || null,
    status,
    sort,
    order,
  });

  const updateParams = useCallback(
    (
      next: Record<string, string | number | null | undefined>,
      options?: { replace?: boolean }
    ) => {
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

  // Debounce the search box into the URL, resetting to page 1 on a new term.
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
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading agencies</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Agencies</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage agency partners, their rosters and their commission.
          </p>
        </div>
        {canManage && (
          <Button className="w-full shrink-0 sm:w-auto" asChild>
            <Link href="/agency/new">
              <Plus className="mr-2 h-4 w-4" />
              Onboard Agency
            </Link>
          </Button>
        )}
      </div>

      {/*
        The headline count tiles (AgencySystemMetrics + useAgencyStats) are
        deliberately not mounted. They are derived — three count-only list
        calls reading `meta.total` — rather than a real aggregate, and v2 has
        no agency dashboard endpoint behind them. Hidden until the BE exposes
        one; both the hook and the component are still exported, so remounting
        is a one-line change.
      */}
      <AgencyListFilters
        search={query}
        onSearchChange={setQuery}
        status={status}
        onStatusChange={(value) => updateParams({ status: value, page: 1 })}
        sort={sort}
        onSortChange={(value) => updateParams({ sort: value, page: 1 })}
        order={order}
        onOrderChange={(value) => updateParams({ order: value, page: 1 })}
      />

      <AgencyListTable rows={data?.items} isLoading={isLoading} />

      <Pagination
        count={data?.meta.total ?? 0}
        currentIdx={data?.meta.page ?? page}
        limit={data?.meta.limit ?? DEFAULT_AGENCY_LIMIT}
      />
    </div>
  );
}

export default function AgencyListPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <AgencyListContent />
    </Suspense>
  );
}
