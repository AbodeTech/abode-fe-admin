"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { toast } from "sonner";

import {
  DEFAULT_EVENT_ALLOCATIONS_LIMIT,
  DEFAULT_EVENT_ELIGIBLE_LIMIT,
  DEFAULT_EVENT_REGISTRATIONS_LIMIT,
  EventAllocatedTable,
  EventAllocationFilters,
  EventAllocationTable,
  EventMetricsPanel,
  EventRegistrationFilters,
  EventRegistrationsTable,
  downloadCsv,
  useCompanyEvent,
  useDeallocateEventClient,
  useEventAllocations,
  useEventAllocationsExport,
  useEventEligibleClients,
  useEventEligibleClientsExport,
  useEventRegistrations,
  useEventRegistrationsExport,
  useSaveEventAllocations,
  type EligibilityTier,
  type EventAllocation,
  type EventEligibleClient,
  type RegistrationCategory,
} from "@/features/company-events";

function EventDetailContent() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const searchParam = searchParams.get("search") || "";
  const eligibilityParam = (searchParams.get("eligibility") as EligibilityTier | null) ?? null;

  const regPage = Number(searchParams.get("reg_page")) || 1;
  const regSearchParam = searchParams.get("reg_search") || "";
  const regCategoryParam = (searchParams.get("reg_category") as RegistrationCategory | null) ?? null;

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [regSearchTerm, setRegSearchTerm] = useState(regSearchParam);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: event, isLoading: eventLoading } = useCompanyEvent(eventId);
  const isAllocationEvent = event?.type === "allocation";

  const eligibleFilters = {
    page,
    limit: DEFAULT_EVENT_ELIGIBLE_LIMIT,
    search: searchParam || null,
    eligibilityTier: eligibilityParam,
  };

  const { data: eligibleData, isLoading: eligibleLoading } = useEventEligibleClients(
    isAllocationEvent ? eventId : undefined,
    eligibleFilters
  );
  // Unfiltered — the Analytics tab's "eligible remaining" shouldn't move just
  // because the Allocation tab's search/eligibility filter happens to be set.
  const { data: eligibleTotalData } = useEventEligibleClients(
    isAllocationEvent ? eventId : undefined,
    { limit: 1 }
  );
  const showCancelledAllocations = searchParams.get("alloc_history") === "1";

  const {
    data: allocatedData,
    isLoading: allocatedLoading,
  } = useEventAllocations(isAllocationEvent ? eventId : undefined, { limit: DEFAULT_EVENT_ALLOCATIONS_LIMIT });

  // The real backend keeps a cancelled allocation's row around as history
  // rather than deleting it (so an admin can review who was removed and
  // when), and re-allocating the same person after a removal creates a new
  // row rather than reviving the old one — the "Allocated" table hides the
  // cancelled rows by default so a removed person doesn't look like they're
  // still committed, with a toggle to review them when wanted.
  const visibleAllocatedRows = showCancelledAllocations
    ? allocatedData?.items
    : allocatedData?.items?.filter((row) => row.status !== "cancelled");

  const registrationFilters = {
    page: regPage,
    limit: DEFAULT_EVENT_REGISTRATIONS_LIMIT,
    search: regSearchParam || undefined,
    category: regCategoryParam ?? undefined,
  };
  const { data: registrationsData, isLoading: registrationsLoading } = useEventRegistrations(
    isAllocationEvent ? eventId : undefined,
    registrationFilters
  );

  const saveAllocations = useSaveEventAllocations();
  const deallocateClient = useDeallocateEventClient();
  const exportEligible = useEventEligibleClientsExport();
  const exportAllocations = useEventAllocationsExport();
  const exportRegistrations = useEventRegistrationsExport();

  const view = (searchParams.get("view") as "allocation" | "analytics" | "registrations" | null) ?? "allocation";

  // `event.reserved_size` is the real, server-computed running total.
  const usedSize = event?.reserved_size ?? 0;

  const updateParams = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      });
      const query = nextParams.toString();
      // `router.push("")` is a same-document relative reference — it re-resolves
      // to the CURRENT url, query string included, so clearing every param this
      // way was a silent no-op. Always push an explicit path instead.
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchParam) {
        updateParams({ search: searchTerm || null, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParam, updateParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (regSearchTerm !== regSearchParam) {
        updateParams({ reg_search: regSearchTerm || null, reg_page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [regSearchTerm, regSearchParam, updateParams]);

  const handleToggle = (row: EventEligibleClient) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(row.payment_plan_id)) {
        next.delete(row.payment_plan_id);
      } else {
        next.add(row.payment_plan_id);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!eventId || selected.size === 0) return;
    saveAllocations.mutate(
      { eventId, paymentPlanIds: Array.from(selected) },
      {
        onSuccess: (result) => {
          setSelected(new Set());
          if (result.succeeded.length > 0) {
            toast.success(`${result.succeeded.length} client${result.succeeded.length === 1 ? "" : "s"} allocated`);
          }
          if (result.failed.length > 0) {
            toast.error(
              `${result.failed.length} could not be saved — someone else may have taken their spot. Refresh and retry.`
            );
          }
        },
        onError: (error) => toast.error(error.message || "Failed to save allocation"),
      }
    );
  };

  const handleRemove = (row: EventAllocation) => {
    if (!eventId) return;
    deallocateClient.mutate(
      { eventId, eventAllocationId: row.allocation_id },
      {
        onSuccess: () => toast.success(`${row.name} removed — their spot is now open again`),
        onError: (error) => toast.error(error.message || "Failed to remove allocation"),
      }
    );
  };

  const handleExportEligible = () => {
    if (!eventId) return;
    exportEligible.mutate(
      { eventId, filters: { search: searchParam || null, eligibilityTier: eligibilityParam } },
      {
        onSuccess: ({ rows, truncated }) => {
          if (!rows.length) {
            toast.info("No eligible clients to export");
            return;
          }
          downloadCsv(
            rows.map((row) => ({
              name: row.name,
              email: row.email,
              phone: row.phone ?? "",
              size: row.size,
              no_of_units: row.no_of_units,
              total_size: row.size * row.no_of_units,
              eligibility_tier: row.eligibility_tier,
              land_completed_at: row.land_completed_at ?? "",
            })),
            `eligible-clients_${eventId}.csv`
          );
          if (truncated) toast.warning("Capped at 1,000 rows — narrow your filters to get everything.");
          else toast.success("Export ready");
        },
        onError: (error) => toast.error(error.message || "Failed to export"),
      }
    );
  };

  const handleExportAllocated = () => {
    if (!eventId) return;
    exportAllocations.mutate(eventId, {
      onSuccess: ({ rows, truncated }) => {
        if (!rows.length) {
          toast.info("No one has been allocated yet");
          return;
        }
        downloadCsv(
          rows.map((row) => ({
            name: row.name,
            email: row.email ?? "",
            phone: row.phone ?? "",
            status: row.status,
            category: row.category ?? "",
            pickup_location: row.pickup_location ?? "",
            size_reserved: row.size_reserved,
            eligibility_tier: row.eligibility_tier,
            allocated_on: row.created_at,
          })),
          `allocated-clients_${eventId}.csv`
        );
        if (truncated) toast.warning("Capped at 1,000 rows.");
        else toast.success("Export ready");
      },
      onError: (error) => toast.error(error.message || "Failed to export"),
    });
  };

  const handleExportRegistrations = () => {
    if (!eventId) return;
    exportRegistrations.mutate(
      { eventId, filters: { search: regSearchParam || undefined, category: regCategoryParam ?? undefined } },
      {
        onSuccess: ({ rows, truncated }) => {
          if (!rows.length) {
            toast.info("No one has registered yet");
            return;
          }
          downloadCsv(
            rows.map((row) => ({
              name: row.name,
              email: row.email,
              phone: row.phone,
              category: row.category,
              pickup_location: row.pickup_location ?? "",
              submitted_at: row.submitted_at ?? "",
            })),
            `registrations_${eventId}.csv`
          );
          if (truncated) toast.warning("Capped at 1,000 rows — narrow your filters to get everything.");
          else toast.success("Export ready");
        },
        onError: (error) => toast.error(error.message || "Failed to export"),
      }
    );
  };

  if (eventLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 md:p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 md:p-6">
        <Link href="/company-events" className="text-xs text-slate-500 hover:underline">
          ← Company Events
        </Link>
        <p className="text-sm text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-6 p-4 pb-24 md:p-6">
      <div className="space-y-2">
        <Link href="/company-events" className="text-xs text-slate-500 hover:underline">
          ← Company Events
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{event.title}</h1>
          <Badge variant="secondary">{event.type === "allocation" ? "Allocation" : "Site Inspection"}</Badge>
          <Badge variant="outline">{event.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {event.asset_name} · {new Date(event.date).toLocaleDateString()} at {event.time}
        </p>
        {event.pickup_locations.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Pickup: {event.pickup_locations.map((loc) => loc.name).join(", ")}
          </p>
        )}
      </div>

      {!isAllocationEvent ? (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center">
          <p className="font-medium text-slate-900">No allocation batch for this event</p>
          <p className="mt-2 text-sm text-slate-500">
            Site inspection days don&apos;t have eligibility or capacity — anyone can attend.
          </p>
        </div>
      ) : (
        <Tabs value={view} onValueChange={(value) => updateParams({ view: value === "allocation" ? null : value })}>
          <TabsList>
            <TabsTrigger value="allocation" className="cursor-pointer">Allocation</TabsTrigger>
            <TabsTrigger value="registrations" className="cursor-pointer">Registrations</TabsTrigger>
            <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="allocation" className="space-y-6 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Eligible clients</h2>
                <p className="text-sm text-muted-foreground">
                  First-come-first-served, already excluding anyone who has received land at this site before.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportEligible} disabled={exportEligible.isPending}>
                {exportEligible.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
            </div>

            <EventAllocationFilters
              search={searchTerm}
              eligibilityTier={eligibilityParam ?? "all"}
              onSearchChange={setSearchTerm}
              onEligibilityTierChange={(value) =>
                updateParams({ eligibility: value === "all" ? null : value, page: 1 })
              }
            />

            <EventAllocationTable
              rows={eligibleData?.items}
              isLoading={eligibleLoading}
              selected={selected}
              onToggle={handleToggle}
              availableSize={event.available_size}
              sizeUnit={event.size_unit}
              usedSize={usedSize}
              onSave={handleSave}
              isSaving={saveAllocations.isPending}
            />

            <Pagination count={eligibleData?.meta.total ?? 0} currentIdx={page} limit={DEFAULT_EVENT_ELIGIBLE_LIMIT} />

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Allocated</h2>
                <p className="text-sm text-muted-foreground">Saved into this event&apos;s batch. Remove frees their reserved size.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportAllocated} disabled={exportAllocations.isPending}>
                {exportAllocations.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
            </div>

            <div className="flex w-fit items-center gap-2">
              <Checkbox
                id="alloc-history-toggle"
                className="cursor-pointer"
                checked={showCancelledAllocations}
                onCheckedChange={(checked) => updateParams({ alloc_history: checked === true ? "1" : null })}
              />
              <Label htmlFor="alloc-history-toggle" className="cursor-pointer text-sm font-normal text-muted-foreground">
                Show removed (history)
              </Label>
            </div>

            <EventAllocatedTable
              rows={visibleAllocatedRows}
              isLoading={allocatedLoading}
              sizeUnit={event.size_unit}
              onRemove={handleRemove}
              removingId={deallocateClient.isPending ? deallocateClient.variables?.eventAllocationId ?? null : null}
            />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Registrations</h2>
                <p className="text-sm text-muted-foreground">Public form submissions for this event.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportRegistrations} disabled={exportRegistrations.isPending}>
                {exportRegistrations.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
            </div>

            <EventRegistrationFilters
              search={regSearchTerm}
              category={regCategoryParam ?? "all"}
              onSearchChange={setRegSearchTerm}
              onCategoryChange={(value) =>
                updateParams({ reg_category: value === "all" ? null : value, reg_page: 1 })
              }
            />

            <EventRegistrationsTable rows={registrationsData?.items} isLoading={registrationsLoading} />

            <Pagination
              count={registrationsData?.meta.total ?? 0}
              currentIdx={regPage}
              limit={DEFAULT_EVENT_REGISTRATIONS_LIMIT}
              pageParam="reg_page"
            />
          </TabsContent>

          <TabsContent value="analytics" className="pt-4">
            {eventId && (
              <EventMetricsPanel
                eventId={eventId}
                availableSize={event.available_size ?? null}
                reservedSize={event.reserved_size}
                sizeUnit={event.size_unit ?? null}
                eligibleRemainingCount={eligibleTotalData?.meta.total ?? 0}
                allocatedRows={allocatedData?.items ?? []}
                allocatedTotal={allocatedData?.meta.total ?? 0}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function CompanyEventDetailPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <EventDetailContent />
    </Suspense>
  );
}
