"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useAssetAllocationEvents } from "../../hooks/use-asset-allocation-events";
import { useSqmInventory } from "../../hooks/use-sqm-inventory";
import { formatEventDate, nextAllocationEvent } from "../../schemas/allocation-event.schema";
import { ledgerTotals, productPositions } from "../../schemas/sqm-inventory.schema";
import { DetailPanel } from "./DetailPanel";

function Mini({
  label,
  value,
  note,
  progress,
}: {
  label: string;
  value: string;
  note: string;
  /** 0–100, or `null` when there is nothing to measure against. */
  progress: number | null;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <strong className="my-1 block text-[17px] font-semibold tabular-nums">{value}</strong>
      <small className="text-[10px] text-muted-foreground">{note}</small>
      <div className="mt-2 h-1.25 overflow-hidden rounded-full bg-muted">
        {progress != null ? (
          <div className="h-full bg-foreground/70" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Readiness for the next physical allocation event on this estate.
 *
 * The first three cards are the event's own numbers from
 * GET /admin/company-events (`available_size`, `reserved_size`,
 * `remaining_capacity`) — capacity is typed in when the event is created and
 * each selected plan reserves against it. The fourth is estate-wide, not
 * per-event: sqm of exact plots already bound to a customer's plan, from the
 * sqm ledger's operational overlay.
 */
export function AllocationEventReadinessCard({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_allocations");
  const canCreate = permissions.has("allocate_land");

  const { data: events, isLoading } = useAssetAllocationEvents(assetId, { enabled: canView });
  const { data: inventory } = useSqmInventory(assetId, { enabled: permissions.has("view_assets") });

  if (!canView) return null;

  const event = events ? nextAllocationEvent(events.items) : null;
  const unit = event?.size_unit ?? "sqm";
  const capacity = event?.available_size ?? null;
  const share = (value: number | null) => (capacity && value != null ? (value / capacity) * 100 : null);

  const ledger = inventory ? ledgerTotals(productPositions(inventory.positions)) : null;
  const hasLedger = Boolean(ledger && ledger.capacity_sqm > 0);

  return (
    <DetailPanel
      title="Allocation event readiness"
      description={
        event
          ? `Shown for the physical allocation event scheduled for ${formatEventDate(event.starts_at)}`
          : "No upcoming physical allocation event on this estate"
      }
      action={
        event ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/company-events/${event.id}`}>Open event</Link>
          </Button>
        ) : canCreate ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/company-events/new?asset_id=${assetId}&type=allocation`}>Create event</Link>
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Mini
            label="Event capacity"
            value={capacity != null ? `${capacity.toLocaleString()} ${unit}` : "—"}
            note={event ? (capacity != null ? "Set when event was created" : "No capacity set on the event") : "No event"}
            progress={capacity != null ? 100 : null}
          />
          <Mini
            label="Reserved for event"
            value={event ? `${event.reserved_size.toLocaleString()} ${unit}` : "—"}
            note="Selected eligible plans"
            progress={share(event?.reserved_size ?? null)}
          />
          <Mini
            label="Remaining event capacity"
            value={event?.remaining_capacity != null ? `${event.remaining_capacity.toLocaleString()} ${unit}` : "—"}
            note="Available for more selections"
            progress={share(event?.remaining_capacity ?? null)}
          />
          <Mini
            label="Already physically allocated"
            value={hasLedger && ledger ? `${ledger.allocated_sqm.toLocaleString()} sqm` : "—"}
            note={
              hasLedger && ledger
                ? `${ledger.allocated_plots.toLocaleString()} exact plot${ledger.allocated_plots === 1 ? "" : "s"} assigned`
                : "Needs the sqm ledger"
            }
            progress={hasLedger && ledger ? (ledger.allocated_sqm / ledger.capacity_sqm) * 100 : null}
          />
        </div>
      )}
    </DetailPanel>
  );
}
