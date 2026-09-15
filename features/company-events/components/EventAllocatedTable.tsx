"use client";

import { Loader2, X } from "lucide-react";

import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { EventAllocationRow } from "../hooks/use-event-allocations";
import type {
  EventAllocationStatus,
  LandAllocationStatus,
} from "../schemas/company-event.schema";

const formatNumber = (value?: number | null) => new Intl.NumberFormat("en-NG").format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

/**
 * Attendance, not land. `invited` replaced `email_sent` when the backend split
 * the two: a row exists from the moment somebody is allocated, which is before
 * any email goes out, and that is the state it starts in.
 */
const STATUS_LABELS: Record<EventAllocationStatus, string> = {
  invited: "Invited",
  registered: "Registered",
  checked_in: "Checked in",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<EventAllocationStatus, "secondary" | "outline" | "default"> = {
  invited: "secondary",
  registered: "outline",
  checked_in: "outline",
  confirmed: "default",
  cancelled: "outline",
};

/**
 * The attendance badge, with the land underneath it only when the two disagree.
 *
 * A column repeating "Allocated" on every row would be noise — the row is in
 * this table because land is committed to it. What an admin needs to see is the
 * exception: a seat whose land has been released.
 */
function StatusBadge({
  status,
  landStatus,
}: {
  status: EventAllocationStatus;
  landStatus?: LandAllocationStatus;
}) {
  return (
    <div className="space-y-1">
      <Badge
        variant={STATUS_VARIANTS[status]}
        className={status === "cancelled" ? "text-muted-foreground" : undefined}
      >
        {STATUS_LABELS[status]}
      </Badge>
      {landStatus === "cancelled" ? (
        <span className="block text-xs text-muted-foreground">Land released</span>
      ) : null}
    </div>
  );
}

interface EventAllocatedTableProps {
  rows?: EventAllocationRow[] | null;
  isLoading?: boolean;
  sizeUnit?: string | null;
  onRemove: (row: EventAllocationRow) => void;
  removingId?: string | null;
}

export function EventAllocatedTable({
  rows,
  isLoading,
  sizeUnit,
  onRemove,
  removingId,
}: EventAllocatedTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRows = rows ?? [];
  const unit = sizeUnit || "sqm";

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No one has been allocated yet.</p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard key={row.id} title={row.name} subtitle={row.email ?? undefined}>
                <AdminMobileField
                  label="Status"
                  value={<StatusBadge status={row.status} landStatus={row.allocation_status} />}
                />
                <AdminMobileField label="Size reserved" value={`${formatNumber(row.size_reserved)} ${unit}`} />
                <AdminMobileField label="Pickup" value={row.pickup_location ?? "—"} />
                <AdminMobileField label="Allocated on" value={formatDate(row.createdAt)} />
                {row.allocation_status !== "cancelled" && (
                  <div className="border-t border-border pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => onRemove(row)}
                      disabled={removingId === row.id}
                    >
                      {removingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Remove
                    </Button>
                  </div>
                )}
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-full table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Client Name
                </TableHead>
                <TableHead className="min-w-52 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="min-w-24 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Size
                </TableHead>
                <TableHead className="min-w-34 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Allocated On
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground">
                    No one has been allocated yet.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">{row.name}</span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      <span className="block">{row.email ?? "—"}</span>
                      <span className="block text-muted-foreground">{row.phone || "—"}</span>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4">
                      <StatusBadge status={row.status} landStatus={row.allocation_status} />
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {formatNumber(row.size_reserved)} {unit}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                      {row.allocation_status !== "cancelled" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => onRemove(row)}
                          disabled={removingId === row.id}
                        >
                          {removingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Remove
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  );
}
