"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DEFAULT_FLEX_LEADS_LIMIT,
  FLEX_LEAD_STATUSES,
  FLEX_LEAD_TYPES,
  FlexLeadDetailModal,
  FlexLeadStatsStrip,
  FlexLeadsFilters,
  FlexLeadsTable,
  useExportFlexLeads,
  useFlexLeads,
  type FlexLeadRow,
  type FlexLeadStatus,
  type FlexLeadType,
} from "@/features/flex-leads";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function FlexLeadsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  // "new" is the working default — the queue an admin actually clears.
  const statusParam = searchParams.get("status") || "new";
  const typeParam = searchParams.get("type") || "all";
  const search = searchParams.get("q") || "";
  const debouncedSearch = useDebounce(search);

  const status = parseEnum<FlexLeadStatus>(statusParam, FLEX_LEAD_STATUSES);
  const type = parseEnum<FlexLeadType>(typeParam, FLEX_LEAD_TYPES);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && !(key === "status" && value === "new")) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, isLoading, error } = useFlexLeads({
    page,
    limit: DEFAULT_FLEX_LEADS_LIMIT,
    status,
    type,
    q: debouncedSearch || undefined,
  });

  const exportLeads = useExportFlexLeads();
  const [detailRow, setDetailRow] = useState<FlexLeadRow | null>(null);

  const handleExport = () => {
    exportLeads.mutate(
      { status, type, q: debouncedSearch || undefined },
      {
        onSuccess: ({ filename }) => toast.success(`Exported ${filename}`),
        onError: (err) => toast.error(err.message || "Export failed"),
      }
    );
  };

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading Flex leads</h3>
        <p>{error.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-20 sm:px-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Flex Leads</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            People who downloaded the Flex brochure or booked a site inspection — follow up and
            update status here.
          </p>
        </div>
      </div>

      <FlexLeadStatsStrip />

      <FlexLeadsFilters
        status={statusParam}
        type={typeParam}
        search={search}
        onStatusChange={(value) => setParam("status", value)}
        onTypeChange={(value) => setParam("type", value)}
        onSearchChange={(value) => setParam("q", value)}
        onExport={handleExport}
        isExporting={exportLeads.isPending}
      />

      <div className="min-w-0 space-y-4">
        <FlexLeadsTable rows={rows} isLoading={isLoading} onView={setDetailRow} />
        {count > DEFAULT_FLEX_LEADS_LIMIT ? (
          <Pagination count={count} currentIdx={page} limit={DEFAULT_FLEX_LEADS_LIMIT} />
        ) : null}
      </div>

      <FlexLeadDetailModal
        open={detailRow !== null}
        row={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
      />
    </div>
  );
}

export default function FlexLeadsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <FlexLeadsContent />
    </Suspense>
  );
}
