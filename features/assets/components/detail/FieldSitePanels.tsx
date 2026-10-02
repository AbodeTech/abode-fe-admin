"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatNaira, formatNairaCompact } from "@/lib/utils/format";

import { useAssetAllocationEvents } from "../../hooks/use-asset-allocation-events";
import {
  useAssetFieldPerformance,
  useAssetFieldStaff,
  useAssignEventOwner,
  useFieldAllocation,
  useFieldCosts,
  useRemoveEventOwner,
} from "../../hooks/use-field-operations";
import {
  FIELD_STAFF_TYPE_LABELS,
  averageScore,
  categoryLabel,
  eligibleEventOwners,
  workerScore,
  type EventAllocationFigures,
  type FieldAssignment,
  type WorkerPerformance,
} from "../../schemas/field-operations.schema";
import { DetailPanel } from "./DetailPanel";

const HEAD =
  "whitespace-nowrap border-b px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";
const CELL = "px-3 py-2.5 align-top";

const day = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function PanelState({ isLoading, error, what }: { isLoading: boolean; error: Error | null; what: string }) {
  if (error) return <p className="p-4 text-sm text-rose-600">Couldn&apos;t load {what}: {error.message}</p>;
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }
  return null;
}

/* ============================================================
 * Field costs
 * ============================================================ */

/**
 * What verified field work has cost on this site (GET .../field-costs).
 * The same amounts reach the Costs tab on their own: verifying a submission
 * with an amount creates a cost record there, marked as coming from field
 * work. This panel is the field-side view of them, entry by entry.
 */
export function FieldCostsPanel({ assetId }: { assetId: string }) {
  const { data, isLoading, error } = useFieldCosts(assetId);

  return (
    <DetailPanel
      title="Cost of field work"
      description="Amounts on verified field work. Each also appears on the Costs tab as a record from field work."
      flush
    >
      <PanelState isLoading={isLoading} error={error} what="field costs" />
      {data ? (
        data.entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No verified field work carries a cost yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-b px-4 py-3.5">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
                <strong className="text-base font-semibold tabular-nums">{formatNairaCompact(data.total_amount)}</strong>
              </div>
              {data.by_category.map((row) => (
                <div key={row.category}>
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                    {categoryLabel(row.category)}
                  </span>
                  <strong className="text-base font-semibold tabular-nums">{formatNairaCompact(row.amount)}</strong>
                </div>
              ))}
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className={HEAD}>Work date</th>
                    <th className={HEAD}>Category</th>
                    <th className={HEAD}>Vendor</th>
                    <th className={HEAD}>Receipts</th>
                    <th className={cn(HEAD, "text-right")}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry, index) => (
                    <tr key={`${entry.submission_id}-${index}`} className="border-b last:border-b-0">
                      <td className={cn(CELL, "whitespace-nowrap")}>{day(entry.work_date)}</td>
                      <td className={CELL}>{categoryLabel(entry.category)}</td>
                      <td className={CELL}>
                        {entry.vendor ?? "—"}
                        {entry.payment_reference ? (
                          <span className="block text-[10px] text-muted-foreground">Ref {entry.payment_reference}</span>
                        ) : null}
                      </td>
                      <td className={CELL}>
                        {entry.receipts.length === 0 ? (
                          <span className="text-muted-foreground">None attached</span>
                        ) : (
                          <span className="flex flex-wrap gap-x-2">
                            {entry.receipts.map((receipt, i) => (
                              <a
                                key={receipt.url}
                                href={receipt.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                              >
                                Receipt {i + 1}
                              </a>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>{formatNaira(entry.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : null}
    </DetailPanel>
  );
}

/* ============================================================
 * Field team
 * ============================================================ */

type TeamRow = {
  id: string;
  name: string;
  staffType: string;
  assignment: FieldAssignment | null;
  performance: WorkerPerformance | null;
};

/** One row per worker, from whichever of the two reads knows about them. */
function teamRows(assignments: FieldAssignment[], workers: WorkerPerformance[]): TeamRow[] {
  const rows = new Map<string, TeamRow>();
  for (const assignment of assignments) {
    const staff = assignment.field_staff;
    if (!staff) continue;
    const existing = rows.get(staff.id);
    // A worker can have several assignments here over time; the active one is the one to show.
    if (existing && (existing.assignment?.is_active || !assignment.is_active)) continue;
    rows.set(staff.id, {
      id: staff.id,
      name: staff.full_name ?? staff.email ?? "Unnamed worker",
      staffType: assignment.staff_type,
      assignment,
      performance: null,
    });
  }
  for (const worker of workers) {
    const existing = rows.get(worker.field_staff.id);
    if (existing) existing.performance = worker;
    else {
      rows.set(worker.field_staff.id, {
        id: worker.field_staff.id,
        name: worker.field_staff.full_name,
        staffType: worker.field_staff.staff_type,
        assignment: null,
        performance: worker,
      });
    }
  }
  return [...rows.values()];
}

/**
 * Who covers this site (GET .../field-staff) and how each is doing against
 * their targets in the chosen month (GET .../field-performance).
 *
 * A score is the share of the month's targets met by verified work, weighted;
 * "projected" adds work still waiting for review. A worker with no targets
 * set for the month has no score, which is not the same as scoring zero.
 */
export function FieldTeamPanel({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canViewStaff = permissions.has("view_field_staff");

  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  });
  const [showPast, setShowPast] = useState(false);

  const staff = useAssetFieldStaff(assetId, showPast, { enabled: canViewStaff });
  const performance = useAssetFieldPerformance(assetId, period.year, period.month);

  const shift = (by: number) =>
    setPeriod(({ year, month }) => {
      const next = new Date(Date.UTC(year, month - 1 + by, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    });

  const rows = teamRows(staff.data ?? [], performance.data?.workers ?? []);
  const average = performance.data ? averageScore(performance.data.workers) : null;
  const monthLabel =
    performance.data?.month ??
    new Date(Date.UTC(period.year, period.month - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <DetailPanel
      title="Field team"
      description="Who covers this site, and their score against the month's targets"
      flush
      action={
        <>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" aria-label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-28 text-center text-xs font-medium">{monthLabel}</span>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" aria-label="Next month" onClick={() => shift(1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      <PanelState
        isLoading={performance.isLoading || (canViewStaff && staff.isLoading)}
        error={performance.error ?? staff.error}
        what="the field team"
      />

      {!performance.isLoading && !performance.error && !(canViewStaff && (staff.isLoading || staff.error)) ? (
        rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No field worker is assigned to this site.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className={HEAD}>Worker</th>
                  <th className={HEAD}>Covers this site</th>
                  <th className={HEAD}>Targets in {monthLabel}</th>
                  <th className={cn(HEAD, "text-right")}>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const score = row.performance ? workerScore(row.performance) : null;
                  const metrics = row.performance?.scorecards.flatMap((card) => card.metrics) ?? [];
                  return (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className={CELL}>
                        <span className="font-semibold">{row.name}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {FIELD_STAFF_TYPE_LABELS[row.staffType] ?? row.staffType}
                        </span>
                      </td>
                      <td className={CELL}>
                        {row.assignment ? (
                          <>
                            {row.assignment.is_active ? "Since" : "From"} {day(row.assignment.starts_on)}
                            {row.assignment.ends_on ? ` to ${day(row.assignment.ends_on)}` : ""}
                            <span className="block text-[10px] capitalize text-muted-foreground">
                              {row.assignment.responsibility}
                              {row.assignment.is_active ? "" : ` · ${row.assignment.status}`}
                              {row.assignment.end_reason ? ` · ${row.assignment.end_reason}` : ""}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={CELL}>
                        {metrics.length === 0 ? (
                          <span className="text-muted-foreground">No targets set</span>
                        ) : (
                          <ul className="space-y-0.5">
                            {metrics.map((metric) => (
                              <li key={metric.metric_key}>
                                {metric.label}: {metric.verified.toLocaleString()} of {metric.target.toLocaleString()}
                                {metric.unit ? ` ${metric.unit}` : ""}
                                {metric.pending > 0 ? (
                                  <span className="text-amber-600"> · {metric.pending.toLocaleString()} awaiting review</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>
                        {score ? (
                          <>
                            <strong className="font-semibold">{score.score}</strong>
                            <span className="text-muted-foreground"> / 100</span>
                            {score.projected !== score.score ? (
                              <span className="block text-[10px] text-muted-foreground">{score.projected} projected</span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        <span>
          {average === null
            ? "No worker has targets for this month, so there is no site average."
            : `Site average ${average} / 100, across workers with targets.`}
        </span>
        {canViewStaff ? (
          <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={() => setShowPast(!showPast)}>
            {showPast ? "Hide past assignments" : "Show past assignments"}
          </button>
        ) : (
          <span>Assignment dates need the view_field_staff permission.</span>
        )}
      </div>
    </DetailPanel>
  );
}

/* ============================================================
 * Allocation events on the ground
 * ============================================================ */

function AssignOwnerDialog({
  assetId,
  target,
  managers,
  onClose,
}: {
  assetId: string;
  target: EventAllocationFigures | null;
  managers: FieldAssignment[];
  onClose: () => void;
}) {
  const assign = useAssignEventOwner(assetId);
  const [staffId, setStaffId] = useState("");
  const [note, setNote] = useState("");

  const close = () => {
    setStaffId("");
    setNote("");
    onClose();
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{target?.owner ? "Change" : "Assign"} the accountable site manager</DialogTitle>
          <DialogDescription>
            {target?.event.title ?? "This allocation event"} · {day(target?.event.starts_at ?? null)}. Customers confirmed by
            a ground scan at this event count towards this manager&apos;s score.
          </DialogDescription>
        </DialogHeader>

        {managers.length === 0 ? (
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            No site manager is assigned to this estate on the event date, and only one who is can be made accountable.
            Site assignments are managed with the field staff accounts, which this screen does not cover.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-owner">Site manager</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger id="event-owner" className="w-full">
                  <SelectValue placeholder="Pick a site manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((row) => (
                    <SelectItem key={row.field_staff!.id} value={row.field_staff!.id}>
                      {row.field_staff!.full_name ?? row.field_staff!.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-owner-note">Note (optional)</Label>
              <Input id="event-owner-note" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={assign.isPending} onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={assign.isPending || !staffId || !target}
            onClick={() =>
              target &&
              assign.mutate(
                { eventId: target.event.id, field_staff_id: staffId, note },
                {
                  onSuccess: (result) => {
                    toast.success(`${result.field_staff.full_name} is accountable for this event`);
                    close();
                  },
                  onError: (error: Error) => toast.error(error.message),
                }
              )
            }
          >
            {assign.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Each allocation event on this estate: how many customers and plans were
 * expected, how many were confirmed on the ground, and which site manager is
 * accountable. "Confirmed" means a ground scan at the event; boarding the bus
 * does not count.
 *
 * The events come from the same list the Overview reads; the figures from
 * the field-allocation endpoints (see `useFieldAllocation`).
 */
export function GroundAllocationPanel({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canAssign = permissions.has("assign_field_staff");
  const canViewStaff = permissions.has("view_field_staff");

  const eventList = useAssetAllocationEvents(assetId);
  const eventIds = (eventList.data?.items ?? []).map((event) => event.id);
  const allocation = useFieldAllocation(assetId, eventIds, { enabled: !eventList.isLoading });
  // Past assignments included: an event in the past may fall inside one that has since ended.
  const staff = useAssetFieldStaff(assetId, true, { enabled: canAssign && canViewStaff });

  const [assigning, setAssigning] = useState<EventAllocationFigures | null>(null);
  const [removing, setRemoving] = useState<EventAllocationFigures | null>(null);
  const removeOwner = useRemoveEventOwner(assetId);

  const isLoading = eventList.isLoading || allocation.isLoading;
  const error = allocation.error ?? eventList.error;
  const canChangeOwner = canAssign && canViewStaff;

  return (
    <DetailPanel
      title="Allocation events on the ground"
      description="Expected against confirmed by a ground scan, and who is accountable"
      flush
    >
      <PanelState isLoading={isLoading} error={error} what="allocation events" />

      {!isLoading && !error ? (
        allocation.events.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">This estate has no allocation events.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className={HEAD}>Event</th>
                  <th className={cn(HEAD, "text-right")}>Expected</th>
                  <th className={cn(HEAD, "text-right")}>Confirmed</th>
                  <th className={cn(HEAD, "text-right")}>Outstanding</th>
                  <th className={cn(HEAD, "text-right")}>Complete</th>
                  <th className={HEAD}>Accountable</th>
                </tr>
              </thead>
              <tbody>
                {allocation.events.map((row) => (
                  <tr key={row.event.id} className="border-b last:border-b-0">
                    <td className={CELL}>
                      <span className="font-semibold">{row.event.title ?? "Untitled event"}</span>
                      <span className="block text-[10px] capitalize text-muted-foreground">
                        {day(row.event.starts_at)}
                        {row.event.status ? ` · ${row.event.status}` : ""}
                      </span>
                    </td>
                    <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>
                      {row.expected.customers} customers
                      <span className="block text-[10px] text-muted-foreground">
                        {row.expected.plans} plans · {row.expected.sqm.toLocaleString()} sqm
                      </span>
                    </td>
                    <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>
                      {row.confirmed.customers} customers
                      <span className="block text-[10px] text-muted-foreground">
                        {row.confirmed.plans} plans · {row.confirmed.sqm.toLocaleString()} sqm
                      </span>
                    </td>
                    <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>
                      {row.outstanding.customers} customers
                      <span className="block text-[10px] text-muted-foreground">{row.outstanding.plans} plans</span>
                    </td>
                    <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>
                      {/* No one allocated yet is not 0% complete. */}
                      {row.completion_pct == null ? "—" : `${row.completion_pct}%`}
                    </td>
                    <td className={CELL}>
                      {row.owner ? (row.owner.full_name ?? "Unnamed manager") : <span className="text-muted-foreground">No one</span>}
                      {canChangeOwner ? (
                        <span className="mt-0.5 flex gap-2 text-[11px]">
                          <button type="button" className="underline underline-offset-4" onClick={() => setAssigning(row)}>
                            {row.owner ? "Change" : "Assign"}
                          </button>
                          {row.owner ? (
                            <button type="button" className="text-rose-600 underline underline-offset-4" onClick={() => setRemoving(row)}>
                              Remove
                            </button>
                          ) : null}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        Only a confirmed ground scan counts. Boarding a bus does not.
        {canAssign && !canViewStaff ? " Choosing who is accountable also needs the view_field_staff permission." : ""}
      </p>

      <AssignOwnerDialog
        assetId={assetId}
        target={assigning}
        managers={assigning ? eligibleEventOwners(staff.data ?? [], assigning.event.starts_at) : []}
        onClose={() => setAssigning(null)}
      />

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove the accountable site manager?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.owner?.full_name ?? "The manager"} will no longer be accountable for{" "}
              {removing?.event.title ?? "this event"}, and its ground confirmations stop counting towards their score.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeOwner.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={removeOwner.isPending}
              onClick={() =>
                removing &&
                removeOwner.mutate(removing.event.id, {
                  onSuccess: () => {
                    toast.success("Owner removed");
                    setRemoving(null);
                  },
                  onError: (err: Error) => toast.error(err.message),
                })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DetailPanel>
  );
}
