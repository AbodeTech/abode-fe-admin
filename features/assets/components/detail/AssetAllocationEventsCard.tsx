"use client";

import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";

import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAssetAllocationEvents } from "../../hooks/use-asset-allocation-events";
import type { AssetAllocationEvent } from "../../schemas/allocation-event.schema";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

function isCompleted(event: AssetAllocationEvent): boolean {
  return event.status === "closed" || new Date(event.starts_at).getTime() < Date.now();
}

/**
 * A small Overview card into the existing, real company-events feature —
 * "Product Position" (the ticket's named destination for this) doesn't exist
 * anywhere in this codebase and is explicitly excluded from Phase 1
 * (docs/ASSETS-ADMIN-DESIGN.md), so this lives here instead, the closest
 * sensible home today. No new backend logic: GET /admin/company-events
 * already filters by asset_id server-side.
 */
export function AssetAllocationEventsCard({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_allocations");
  const canCreate = permissions.has("allocate_land");

  const { data, isLoading } = useAssetAllocationEvents(assetId, { enabled: canView });

  if (!canView) return null;

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-16 w-full" />
      </section>
    );
  }

  const events = data.items;
  const latestCompleted = events.find(isCompleted) ?? null;
  const createHref = `/company-events/new?asset_id=${assetId}&type=allocation`;

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Allocation events</h2>
          <p className="text-xs text-muted-foreground">Company events reserving inventory for this estate.</p>
        </div>
        {canCreate ? (
          <Button asChild variant="outline" size="sm">
            <Link href={createHref}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create event
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="p-4 sm:p-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarClock className="h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No allocation events yet for this asset.</p>
            <p className="text-xs text-muted-foreground">
              Create one to start reserving inventory for a scheduled allocation day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {latestCompleted ? (
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Latest completed
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/company-events/${latestCompleted.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                    {latestCompleted.title}
                  </Link>
                  <Badge variant="outline">{STATUS_LABELS[latestCompleted.status] ?? latestCompleted.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latestCompleted.reserved_size.toLocaleString()}
                  {latestCompleted.size_unit ? ` ${latestCompleted.size_unit}` : ""} reserved
                  {latestCompleted.remaining_capacity != null
                    ? ` · ${latestCompleted.remaining_capacity.toLocaleString()} remaining`
                    : ""}
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">History</p>
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/company-events/${event.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
                >
                  <span className="truncate">{event.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {event.date}
                    <Badge variant="outline" className="text-[10px]">
                      {STATUS_LABELS[event.status] ?? event.status}
                    </Badge>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
