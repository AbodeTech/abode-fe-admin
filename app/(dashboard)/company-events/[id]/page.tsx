"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { Copy, Download, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { toast } from "sonner";

import {
  DEFAULT_EVENT_ALLOCATIONS_LIMIT,
  DEFAULT_EVENT_ELIGIBLE_LIMIT,
  DEFAULT_EVENT_REGISTRATIONS_LIMIT,
  EventAllocatedTable,
  AttendeeActionDialog,
  ConfirmationSheetPanel,
  EventAllocationFilters,
  InvitedClientsFilters,
  type InvitedAttendanceFilter,
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
  useResendEventInvite,
  useUpdateEventStatus,
  type EligibilityTier,
  type EventAllocation,
  type EventEligibleClient,
  type EventRegistrationRow,
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
  const regStatusParam = (searchParams.get("reg_status") as EventAllocation['status'] | null) ?? null;
  const regPickupParam = searchParams.get("reg_pickup") ?? "";

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [regSearchTerm, setRegSearchTerm] = useState(regSearchParam);
  const [selected, setSelected] = useState<Map<string, EventEligibleClient>>(new Map());
  const selectedIds = new Set(selected.keys());
  const selectedSize = Array.from(selected.values()).reduce((sum, row) => sum + row.size * row.no_of_units, 0);
  const selectedPeopleCount = new Set(Array.from(selected.values()).map((row) => row.user_id)).size;
  const selectedPlotCount = Array.from(selected.values()).reduce((sum, row) => sum + row.no_of_units, 0);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [attendeeAction, setAttendeeAction] = useState<{
    mode: 'register' | 'pickup'; registrationId: string; name: string; email: string | null; phone: string | null;
  } | null>(null);

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
  const allocPage = Number(searchParams.get("alloc_page")) || 1;
  const allocSearchParam = searchParams.get("alloc_search") || "";
  const allocStatusParam = (searchParams.get("alloc_status") as InvitedAttendanceFilter | null) ?? null;
  const [allocSearchTerm, setAllocSearchTerm] = useState(allocSearchParam);

  const {
    data: allocatedData,
    isLoading: allocatedLoading,
  } = useEventAllocations(isAllocationEvent ? eventId : undefined, {
    page: allocPage,
    limit: DEFAULT_EVENT_ALLOCATIONS_LIMIT,
    include_removed: showCancelledAllocations,
    search: allocSearchParam || undefined,
    status: allocStatusParam && allocStatusParam !== "all" ? allocStatusParam : undefined,
  });

  // The real backend keeps a cancelled allocation's row around as history
  // rather than deleting it (so an admin can review who was removed and
  // when), and re-allocating the same person after a removal creates a new
  // row rather than reviving the old one — the "Allocated" table hides the
  // cancelled rows by default so a removed person doesn't look like they're
  // still committed, with a toggle to review them when wanted.
  // The server leaves removed people out unless the toggle asks for them, so paging stays right.
  const visibleAllocatedRows = allocatedData?.items;

  const registrationFilters = {
    page: regPage,
    limit: DEFAULT_EVENT_REGISTRATIONS_LIMIT,
    search: regSearchParam || undefined,
    category: regCategoryParam ?? undefined,
    status: regStatusParam ?? undefined,
    pickupLocationId: regPickupParam || undefined,
  };
  // Real for both event types — `listEventRegistrations` doesn't gate on
  // `type` (only `getEventAnalytics` does), so a site-inspection event's
  // registrants come back from the same endpoint the allocation flow uses.
  const { data: registrationsData, isLoading: registrationsLoading } = useEventRegistrations(
    eventId,
    registrationFilters
  );

  const saveAllocations = useSaveEventAllocations();
  const deallocateClient = useDeallocateEventClient();
  const exportEligible = useEventEligibleClientsExport();
  const exportAllocations = useEventAllocationsExport();
  const exportRegistrations = useEventRegistrationsExport();
  const updateEventStatus = useUpdateEventStatus();

  const view = (searchParams.get("view") as "allocation" | "analytics" | "registrations" | null) ?? "allocation";

  // `event.reserved_size` is the real, server-computed running total.
  const usedSize = event?.reserved_size ?? 0;

  // Not personalized like the allocation flow's per-person emailed link —
  // one public URL per event, shared however the admin chooses.
  const publicBase = (process.env.NEXT_PUBLIC_FE_APP_URL || "https://app.abode.ng").replace(/\/$/, "");
  const registrationLink = publicBase && eventId
    ? event?.type === "allocation"
      ? `${publicBase}/${event.slug || eventId}`
      : `${publicBase}/site-inspection/${eventId}`
    : "";

  const handleCopyLink = async () => {
    if (!registrationLink) return;
    try {
      await navigator.clipboard.writeText(registrationLink);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy — copy it manually instead");
    }
  };

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
      if (allocSearchTerm !== allocSearchParam) {
        updateParams({ alloc_search: allocSearchTerm || null, alloc_page: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [allocSearchTerm, allocSearchParam, updateParams]);

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
      const next = new Map(prev);
      if (next.has(row.payment_plan_id)) {
        next.delete(row.payment_plan_id);
      } else {
        next.set(row.payment_plan_id, row);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!eventId || selected.size === 0) return;
    saveAllocations.mutate(
      { eventId, paymentPlanIds: Array.from(selected.keys()) },
      {
        onSuccess: (result) => {
          setSelected(new Map());
          if (result.succeeded.length > 0) {
            const savedRows = result.succeeded.map((saved) => selected.get(saved.payment_plan_id)).filter((row): row is EventEligibleClient => !!row);
            const people = new Set(savedRows.map((row) => row.user_id)).size;
            const plots = savedRows.reduce((sum, row) => sum + row.no_of_units, 0);
            toast.success(`${people} clients invited, covering ${plots} plots`);
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

  const resendInvite = useResendEventInvite();
  const handleResendInvite = (row: EventAllocation) => {
    if (!eventId || !row.attendance_id) return;
    resendInvite.mutate(
      { eventId, registrationId: row.attendance_id },
      {
        onSuccess: (result) => toast.success(`Invitation resent to ${result.email}`),
        onError: (error) => toast.error(error.message || "Failed to resend the invitation"),
      }
    );
  };

  const openAllocatedAction = (row: EventAllocation, mode: 'register' | 'pickup') => {
    if (!row.attendance_id) return;
    setAttendeeAction({ mode, registrationId: row.attendance_id, name: row.name, email: row.email, phone: row.phone });
  };

  const openRegistrationAction = (row: EventRegistrationRow) => {
    setAttendeeAction({ mode: 'pickup', registrationId: row.registration_id, name: row.name, email: row.email, phone: row.phone });
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
          toast.info("No one has been invited yet");
          return;
        }
        downloadCsv(
          rows.map((row) => ({
            name: row.name,
            email: row.email ?? "",
            phone: row.phone ?? "",
            status: row.status,
            land_status: row.allocation_status ?? 'allocated',
            category: row.category ?? "",
            pickup_location: row.pickup_location ?? "",
            size_reserved: row.size_reserved,
            eligibility_tier: row.eligibility_tier,
            invited_on: row.created_at,
            checked_in_at: row.checked_in_at ?? '',
            confirmed_at: row.confirmed_at ?? '',
          })),
          `invited-clients_${eventId}.csv`
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
      { eventId, filters: { search: regSearchParam || undefined, category: regCategoryParam ?? undefined, status: regStatusParam ?? undefined, pickupLocationId: regPickupParam || undefined } },
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
              attending_as: row.getting_land ? 'Getting land' : 'Visitor',
              status: row.status ?? '',
              pickup_location: row.pickup_location ?? "",
              checked_in_at: row.checked_in_at ?? '',
              confirmed_at: row.confirmed_at ?? '',
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

  const handlePublish = () => {
    if (!eventId) return;
    updateEventStatus.mutate(
      { eventId, status: "published" },
      {
        onSuccess: () => toast.success("Event published"),
        onError: (error) => toast.error(error.message || "Failed to publish event"),
      }
    );
  };

  const handleReopen = () => {
    if (!eventId) return;
    updateEventStatus.mutate(
      { eventId, status: "published" },
      {
        onSuccess: () => toast.success("Event reopened"),
        onError: (error) => toast.error(error.message || "Failed to reopen event"),
      }
    );
  };

  const handleClose = () => {
    if (!eventId) return;
    updateEventStatus.mutate(
      { eventId, status: "closed" },
      {
        onSuccess: () => {
          setCloseConfirmOpen(false);
          toast.success("Event closed");
        },
        onError: (error) => {
          setCloseConfirmOpen(false);
          toast.error(error.message || "Failed to close event");
        },
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{event.title}</h1>
            <Badge variant="secondary">{event.type === "allocation" ? "Allocation" : "Site Inspection"}</Badge>
            <Badge variant="outline">{event.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {event.status === "draft" && (
              <Button size="sm" onClick={handlePublish} disabled={updateEventStatus.isPending}>
                {updateEventStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Publish
              </Button>
            )}
            {event.status === "published" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloseConfirmOpen(true)}
                disabled={updateEventStatus.isPending}
              >
                Close event
              </Button>
            )}
            {event.status === "closed" && (
              <Button variant="outline" size="sm" onClick={handleReopen} disabled={updateEventStatus.isPending}>
                {updateEventStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reopen
              </Button>
            )}
          </div>
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

      {isAllocationEvent && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Public registration</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.open_registration === false
                  ? 'Invitation only — visitors cannot sign up from this link.'
                  : 'Share this link with visitors who are coming to the allocation day.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              Confirmation sheet
            </Button>
          </div>
          {event.status === 'draft' && (
            <p className="mt-3 text-sm text-amber-600">Publish this event to open public registration.</p>
          )}
          {event.status === 'closed' && (
            <p className="mt-3 text-sm text-muted-foreground">Public registration is closed for this event.</p>
          )}
          {event.status === 'published' && event.open_registration !== false && registrationLink && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {registrationLink}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="mr-2 size-4" /> Copy link
              </Button>
            </div>
          )}
        </div>
      )}

      {!isAllocationEvent ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Registration link</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Site inspection days don&apos;t have eligibility or capacity — anyone can attend. Share this link
              however you like; everyone who submits it shows up below.
            </p>
            {event.status === "draft" ? (
              <p className="mt-3 text-sm text-amber-600">
                This event is still a draft — publish it before sharing the link.
              </p>
            ) : registrationLink ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {registrationLink}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">The public registration link is unavailable.</p>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Registrants</h2>
              <p className="text-sm text-muted-foreground">Everyone who has signed up via the link above.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportRegistrations}
              disabled={exportRegistrations.isPending}
            >
              {exportRegistrations.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </Button>
          </div>

          <EventRegistrationFilters
            search={regSearchTerm}
            category={regCategoryParam ?? "all"}
            status={regStatusParam ?? 'all'}
            pickupLocationId={regPickupParam}
            pickupLocations={event.pickup_locations}
            onSearchChange={setRegSearchTerm}
            onCategoryChange={(value) => updateParams({ reg_category: value === "all" ? null : value, reg_page: 1 })}
            onStatusChange={(value) => updateParams({ reg_status: value === 'all' ? null : value, reg_page: 1 })}
            onPickupChange={(value) => updateParams({ reg_pickup: value || null, reg_page: 1 })}
          />

          <EventRegistrationsTable rows={registrationsData?.items} isLoading={registrationsLoading} />

          <Pagination
            count={registrationsData?.meta.total ?? 0}
            currentIdx={regPage}
            limit={DEFAULT_EVENT_REGISTRATIONS_LIMIT}
            pageParam="reg_page"
          />
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
                  First-come-first-served, for plans with completed land payments and no active event allocation.
                </p>
                <p className="text-xs text-muted-foreground">{eligibleData?.meta.total ?? 0} plans match these filters.</p>
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
              selected={selectedIds}
              selectedSize={selectedSize}
              selectedPeopleCount={selectedPeopleCount}
              selectedPlotCount={selectedPlotCount}
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
                <h2 className="text-lg font-semibold">Invited clients</h2>
                <p className="text-sm text-muted-foreground">Clients saved into this event&apos;s batch and invited. Attendance shows how far each has got: invited, registered, checked in, confirmed. Remove frees their reserved size.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportAllocated} disabled={exportAllocations.isPending}>
                {exportAllocations.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
            </div>

            <InvitedClientsFilters
              search={allocSearchTerm}
              attendance={allocStatusParam ?? "all"}
              onSearchChange={setAllocSearchTerm}
              onAttendanceChange={(value) =>
                updateParams({ alloc_status: value === "all" ? null : value, alloc_page: null })
              }
            />

            <div className="flex w-fit items-center gap-2">
              <Checkbox
                id="alloc-history-toggle"
                className="cursor-pointer"
                checked={showCancelledAllocations}
                onCheckedChange={(checked) => updateParams({ alloc_history: checked === true ? "1" : null, alloc_page: null })}
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
              onRegister={(row) => openAllocatedAction(row, 'register')}
              onChangePickup={(row) => openAllocatedAction(row, 'pickup')}
              onResendInvite={handleResendInvite}
              emptyMessage={
                allocSearchParam || (allocStatusParam && allocStatusParam !== "all")
                  ? "No one matches these filters."
                  : undefined
              }
              removingId={deallocateClient.isPending ? deallocateClient.variables?.eventAllocationId ?? null : null}
              busyId={
                resendInvite.isPending
                  ? visibleAllocatedRows?.find((r) => r.attendance_id === resendInvite.variables?.registrationId)?.allocation_id ?? null
                  : null
              }
            />

            <Pagination
              count={allocatedData?.meta.total ?? 0}
              currentIdx={allocPage}
              limit={DEFAULT_EVENT_ALLOCATIONS_LIMIT}
              pageParam="alloc_page"
            />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Registered attendees</h2>
                <p className="text-sm text-muted-foreground">{registrationsData?.meta.total ?? 0} people match these filters, including visitors and people getting land. Invited people appear in Invited clients until they register.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportRegistrations} disabled={exportRegistrations.isPending}>
                {exportRegistrations.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
            </div>

            <EventRegistrationFilters
              search={regSearchTerm}
              category={regCategoryParam ?? "all"}
              status={regStatusParam ?? 'all'}
              pickupLocationId={regPickupParam}
              pickupLocations={event.pickup_locations}
              onSearchChange={setRegSearchTerm}
              onCategoryChange={(value) =>
                updateParams({ reg_category: value === "all" ? null : value, reg_page: 1 })
              }
              onStatusChange={(value) => updateParams({ reg_status: value === 'all' ? null : value, reg_page: 1 })}
              onPickupChange={(value) => updateParams({ reg_pickup: value || null, reg_page: 1 })}
            />

            <EventRegistrationsTable rows={registrationsData?.items} isLoading={registrationsLoading} onChangePickup={openRegistrationAction} />

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
                eventStatus={event.status}
                availableSize={event.available_size ?? null}
                reservedSize={event.reserved_size}
                sizeUnit={event.size_unit ?? null}
                eligibleRemainingCount={eligibleTotalData?.meta.total ?? 0}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      <ConfirmDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="Close this event?"
        description="Closing freezes further allocation changes and hides the event from the public kiosk. You can reopen it later."
        confirmLabel="Close event"
        onConfirm={handleClose}
        destructive
      />
      <ConfirmationSheetPanel open={sheetOpen} onOpenChange={setSheetOpen} eventId={eventId} pickupLocations={event.pickup_locations} />
      {attendeeAction && (
        <AttendeeActionDialog
          open
          onOpenChange={(open) => { if (!open) setAttendeeAction(null); }}
          eventId={eventId}
          registrationId={attendeeAction.registrationId}
          name={attendeeAction.name}
          email={attendeeAction.email}
          phone={attendeeAction.phone}
          pickupLocations={event.pickup_locations}
          mode={attendeeAction.mode}
        />
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
