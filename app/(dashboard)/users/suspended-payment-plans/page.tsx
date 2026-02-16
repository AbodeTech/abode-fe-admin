"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { FilterSelect } from "@/components/shared/FilterSelect";
import {
  SuspendedPaymentPlansTable,
  useSuspendedPaymentPlans,
  useExportSuspendedPaymentPlans,
} from "@/features/users";
import { Loader2, Download, Search } from "lucide-react";

const PAGE_SIZE = 25;

function SuspendedPaymentPlansContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const searchQuery = searchParams.get("search") || null;
  const assetType = searchParams.get("assettype") || null;
  const [searchValue, setSearchValue] = useState(searchQuery ?? "");

  const { data, isLoading, error } = useSuspendedPaymentPlans({
    page,
    limit: PAGE_SIZE,
    searchQuery,
    assetType,
  });
  const exportMutation = useExportSuspendedPaymentPlans();

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleExport = async () => {
    await exportMutation.mutateAsync({ searchQuery, assetType });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading suspended payment plans</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Suspended Payment Plans</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name"
                className="pl-8 w-64"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Apply
            </Button>
          </div>
          <FilterSelect
            data={[
              { label: "All users", value: "all" },
              { label: "Flex", value: "flex" },
              { label: "Full ownership", value: "full-ownership" },
            ]}
            queryKey="assettype"
            placeholder="Asset type"
          />
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
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

      <Card>
        <CardHeader>
          <CardTitle>Users with suspended payment plans</CardTitle>
        </CardHeader>
        <CardContent>
          <SuspendedPaymentPlansTable plans={rows} />
          <Pagination count={count} currentIdx={page} limit={PAGE_SIZE} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuspendedPaymentPlansPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SuspendedPaymentPlansContent />
    </Suspense>
  );
}
