"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { FilterSelect } from "@/components/shared/FilterSelect";
import {
  SuspendedPaymentPlansTable,
  TerminationPaymentPlansSummary,
  useSuspendedPaymentPlans,
  useExportSuspendedPaymentPlans,
  SUSPENDED_PAYMENT_PLANS_PAGE_SIZE,
} from "@/features/users";
import {
  computeTerminationPaymentPlansMetrics,
  parseTerminationPaymentPlanRows,
} from "@/features/users/utils/compute-termination-payment-plans-metrics";
import { Loader2, Download, Search } from "lucide-react";
import { PageContentLoader, SuspensePageFallback } from "@/components/shared/page-content-loader";

const METRICS_FETCH_CAP = 10_000;

function TerminationPaymentPlansContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const searchQuery = searchParams.get("search") || null;
  const assetType = searchParams.get("assettype") || null;
  const [searchValue, setSearchValue] = useState(searchQuery ?? "");

  const { data, isLoading, error } = useSuspendedPaymentPlans({
    page,
    limit: SUSPENDED_PAYMENT_PLANS_PAGE_SIZE,
    searchQuery,
    assetType,
  });
  const count = data?.count ?? 0;

  const { data: metricsData, isLoading: metricsLoading } = useSuspendedPaymentPlans({
    page: 1,
    limit: Math.min(count, METRICS_FETCH_CAP),
    searchQuery,
    assetType,
    enabled: !isLoading && count > 0,
  });

  const exportMutation = useExportSuspendedPaymentPlans();

  const metrics = useMemo(() => {
    const rows = parseTerminationPaymentPlanRows(
      count > 0 ? (metricsData?.data ?? data?.data) : []
    );
    return computeTerminationPaymentPlansMetrics(rows, count);
  }, [metricsData?.data, data?.data, count]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleExport = async () => {
    await exportMutation.mutateAsync({ searchQuery, assetType });
  };

  if (isLoading) {
    return <PageContentLoader label="Loading termination payment plans…" />;
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading termination payment plans</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-20 sm:px-4">
      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Termination Payment Plans</h2>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:max-w-md sm:flex-row sm:items-center">
            <div className="relative w-full min-w-0 flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name"
                className="w-full min-w-0 pl-8"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={handleSearch}>
              Apply
            </Button>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <FilterSelect
              data={[
                { label: "All users", value: "all" },
                { label: "Flex", value: "flex" },
                { label: "Full ownership", value: "full-ownership" },
              ]}
              queryKey="assettype"
              placeholder="Asset type"
            />
            <Button
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <TerminationPaymentPlansSummary metrics={metrics} isLoading={metricsLoading && count > 0} />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="px-4">
          <CardTitle>Users with termination payment plans</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 px-4">
          <div className="min-w-0 overflow-x-auto">
            <SuspendedPaymentPlansTable plans={rows} />
          </div>
          <Pagination count={count} currentIdx={page} limit={SUSPENDED_PAYMENT_PLANS_PAGE_SIZE} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function TerminationPaymentPlansPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <TerminationPaymentPlansContent />
    </Suspense>
  );
}
