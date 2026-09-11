"use client";

import { Loader2 } from "lucide-react";

import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { EligibilityTier, EventEligibleClient } from "../schemas/company-event.schema";

const formatNumber = (value?: number | null) => new Intl.NumberFormat("en-NG").format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

/** `size` is per-unit — the real commit size is `size * no_of_units` (matches the backend's `saveAllocations`). */
const totalSize = (row: EventEligibleClient) => row.size * row.no_of_units;

const ELIGIBILITY_LABELS: Record<EligibilityTier, string> = {
  land: "Land",
  land_and_dev_levy: "Land + Dev Levy",
};

function EligibilityBadge({ tier }: { tier: EligibilityTier }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-block max-w-full whitespace-normal px-2.5 py-1 text-left text-sm font-normal leading-snug",
        tier === "land_and_dev_levy" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
      )}
    >
      {ELIGIBILITY_LABELS[tier]}
    </Badge>
  );
}

interface EventAllocationTableProps {
  rows?: EventEligibleClient[] | null;
  isLoading?: boolean;
  selected: Set<string>;
  onToggle: (row: EventEligibleClient) => void;
  availableSize?: number | null;
  sizeUnit?: string | null;
  /** Size already committed by a prior save for this event. */
  usedSize: number;
  onSave: () => void;
  isSaving?: boolean;
}

export function EventAllocationTable({
  rows,
  isLoading,
  selected,
  onToggle,
  availableSize,
  sizeUnit,
  usedSize,
  onSave,
  isSaving,
}: EventAllocationTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-16 w-full" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRows = rows ?? [];
  const selectedSize = safeRows
    .filter((row) => selected.has(row.payment_plan_id))
    .reduce((sum, row) => sum + totalSize(row), 0);
  const grandTotal = usedSize + selectedSize;
  const capacity = availableSize ?? null;
  const percent = capacity ? Math.min(100, Math.round((grandTotal / capacity) * 100)) : 0;
  const atOrOverCapacity = capacity != null && grandTotal >= capacity;
  const unit = sizeUnit || "sqm";

  const wouldExceedCapacity = (row: EventEligibleClient) =>
    capacity != null && !selected.has(row.payment_plan_id) && grandTotal + totalSize(row) > capacity;

  const handleRowClick = (row: EventEligibleClient, disabled: boolean) => {
    if (disabled) return;
    onToggle(row);
  };

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-4 p-3 sm:p-4">
        {/*
          Lives at the top, not the bottom: an admin selecting rows out of a
          25-row page shouldn't have to scroll past the whole table to see
          how much capacity is left or to hit Save.
        */}
        <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {capacity != null
                    ? `${formatNumber(grandTotal)} / ${formatNumber(capacity)} ${unit} allocated`
                    : `${formatNumber(grandTotal)} ${unit} allocated (no capacity set)`}
                </span>
                <span className="font-medium">{selected.size} selected</span>
              </div>
              {capacity != null && (
                <Progress value={percent} className={cn(atOrOverCapacity && "[&>div]:bg-destructive")} />
              )}
            </div>
            <Button
              onClick={onSave}
              disabled={isSaving || selected.size === 0 || (capacity != null && grandTotal > capacity)}
              className="w-full shrink-0 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Save allocation${selected.size ? ` (${selected.size})` : ""}`
              )}
            </Button>
          </div>
        </div>

        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No eligible clients found.</p>
          ) : (
            safeRows.map((row) => {
              const disabled = wouldExceedCapacity(row);
              const isSelected = selected.has(row.payment_plan_id);
              return (
                <AdminMobileCard
                  key={row.payment_plan_id}
                  title={row.name}
                  subtitle={row.email}
                  onClick={disabled ? undefined : () => onToggle(row)}
                  className={cn(isSelected && "border-primary/50 bg-primary/5", disabled && "opacity-60")}
                >
                  <AdminMobileField label="Phone" value={row.phone || "—"} />
                  <AdminMobileField label="Size" value={`${formatNumber(totalSize(row))} ${unit}`} />
                  <AdminMobileField label="Eligibility" value={<EligibilityBadge tier={row.eligibility_tier} />} />
                  <AdminMobileField label="Land completed" value={formatDate(row.land_completed_at)} />
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm text-muted-foreground">Select for allocation</span>
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      onCheckedChange={() => onToggle(row)}
                      onClick={(e) => e.stopPropagation()}
                      className="size-5"
                    />
                  </div>
                </AdminMobileCard>
              );
            })
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-full table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-4 py-3.5" />
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Client Name
                </TableHead>
                <TableHead className="min-w-52 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="min-w-24 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Size
                </TableHead>
                <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Eligibility
                </TableHead>
                <TableHead className="min-w-34 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Land Completed
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground">
                    No eligible clients found.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => {
                  const disabled = wouldExceedCapacity(row);
                  const isSelected = selected.has(row.payment_plan_id);
                  return (
                    <TableRow
                      key={row.payment_plan_id}
                      onClick={() => handleRowClick(row, disabled)}
                      className={cn(
                        disabled ? "opacity-60" : "cursor-pointer hover:bg-muted/40",
                        isSelected && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <TableCell className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          disabled={disabled}
                          onCheckedChange={() => onToggle(row)}
                          className="size-5"
                        />
                      </TableCell>
                      <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                        <span className="block wrap-break-word font-medium">{row.name}</span>
                      </TableCell>
                      <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                        <span className="block">{row.email}</span>
                        <span className="block text-muted-foreground">{row.phone || "—"}</span>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                        {formatNumber(totalSize(row))} {unit}
                      </TableCell>
                      <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                        <EligibilityBadge tier={row.eligibility_tier} />
                      </TableCell>
                      <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                        {formatDate(row.land_completed_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  );
}
