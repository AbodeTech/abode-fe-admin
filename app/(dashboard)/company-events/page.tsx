"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  DEFAULT_COMPANY_EVENT_LIMIT,
  EventsListTable,
  downloadCsv,
  useCompanyEvents,
  useCompanyEventsExport,
  type CompanyEventType,
} from "@/features/company-events";

function CompanyEventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const typeParam = (searchParams.get("type") as CompanyEventType | null) ?? null;
  const searchParam = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(searchParam);

  const { data, isLoading, error } = useCompanyEvents({
    page,
    limit: DEFAULT_COMPANY_EVENT_LIMIT,
    type: typeParam,
    search: searchParam || null,
  });
  const exportEvents = useCompanyEventsExport();

  const handleExport = () => {
    exportEvents.mutate(
      { type: typeParam, search: searchParam || null },
      {
        onSuccess: ({ rows, truncated }) => {
          if (!rows.length) {
            toast.info("No events to export");
            return;
          }
          downloadCsv(
            rows.map((event) => ({
              title: event.title,
              type: event.type,
              site: event.asset_name,
              date: event.date,
              time: event.time,
              status: event.status,
              available_size: event.available_size ?? "",
              size_unit: event.size_unit ?? "",
              pickup_locations: event.pickup_locations.map((loc) => loc.name).join("; "),
            })),
            `company-events_${new Date().toISOString().slice(0, 10)}.csv`
          );
          if (truncated) toast.warning("Capped at 1,000 rows — narrow your filters to get everything.");
          else toast.success("Export ready");
        },
        onError: (error) => toast.error(error.message || "Failed to export"),
      }
    );
  };

  const updateParams = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const query = params.toString();
      router.push(query ? `?${query}` : "");
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchParam) {
        updateParams({ search: searchTerm || null, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParam, updateParams]);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading company events</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-4 pb-24 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Company Events</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Site inspections and allocation days.
          </p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <Button variant="outline" onClick={handleExport} disabled={exportEvents.isPending} className="w-full sm:w-auto">
            {exportEvents.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
          <Button asChild className="w-full gap-2 sm:w-auto">
            <Link href="/company-events/new">
              <Plus className="h-4 w-4" />
              New event
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={typeParam ?? "all"} onValueChange={(value) => updateParams({ type: value === "all" ? null : value, page: 1 })}>
          <TabsList>
            <TabsTrigger value="all" className="cursor-pointer">All</TabsTrigger>
            <TabsTrigger value="site_inspection" className="cursor-pointer">Site Inspection</TabsTrigger>
            <TabsTrigger value="allocation" className="cursor-pointer">Allocation</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          className="w-full sm:w-72"
          placeholder="Search events"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <EventsListTable rows={data?.items} isLoading={isLoading} />

      <Pagination count={data?.meta.total ?? 0} currentIdx={page} limit={DEFAULT_COMPANY_EVENT_LIMIT} />
    </div>
  );
}

export default function CompanyEventsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <CompanyEventsContent />
    </Suspense>
  );
}
