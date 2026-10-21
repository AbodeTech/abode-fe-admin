"use client";

import { Loader2, MoreVertical } from "lucide-react";

import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { EventAllocation, EventAllocationStatus } from "../schemas/company-event.schema";

const formatNumber = (value?: number | null) => new Intl.NumberFormat("en-NG").format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const STATUS_LABELS: Record<EventAllocationStatus, string> = {
  invited: "Invited",
  allocated: "Added",
  email_sent: "Invite sent",
  registered: "Registered",
  checked_in: "Checked in",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<EventAllocationStatus, "secondary" | "outline" | "default"> = {
  invited: "secondary",
  allocated: "secondary",
  email_sent: "secondary",
  registered: "outline",
  checked_in: "outline",
  confirmed: "default",
  cancelled: "outline",
};

function StatusBadge({ status, landStatus }: { status: EventAllocationStatus; landStatus?: 'allocated' | 'cancelled' }) {
  return (
    <div className="space-y-1">
      <Badge variant={STATUS_VARIANTS[status]} className={status === "cancelled" ? "text-muted-foreground" : undefined}>{STATUS_LABELS[status]}</Badge>
      {landStatus === 'cancelled' && <span className="block text-xs text-muted-foreground">Land released</span>}
    </div>
  );
}

interface EventAllocatedTableProps {
  rows?: EventAllocation[] | null;
  isLoading?: boolean;
  sizeUnit?: string | null;
  onRemove: (row: EventAllocation) => void;
  onRegister?: (row: EventAllocation) => void;
  onChangePickup?: (row: EventAllocation) => void;
  onResendInvite?: (row: EventAllocation) => void;
  removingId?: string | null;
  /** The row an action is running on, so its menu shows a spinner. */
  busyId?: string | null;
  /** Shown when there are no rows, e.g. when a search or filter matches nobody. */
  emptyMessage?: string;
}

/** One ⋮ menu per row, offering only what fits the attendee's stage. */
function RowActions({
  row,
  onRemove,
  onRegister,
  onChangePickup,
  onResendInvite,
  busy,
}: {
  row: EventAllocation;
  onRemove: (row: EventAllocation) => void;
  onRegister?: (row: EventAllocation) => void;
  onChangePickup?: (row: EventAllocation) => void;
  onResendInvite?: (row: EventAllocation) => void;
  busy: boolean;
}) {
  const active = row.allocation_status !== "cancelled" && row.status !== "cancelled";
  const invited = Boolean(row.attendance_id) && row.status === "invited";
  const registered = Boolean(row.attendance_id) && row.status !== "invited" && row.status !== "cancelled";
  const canResend = active && invited && Boolean(onResendInvite);
  const canRegister = active && invited && Boolean(onRegister);
  const canPickup = active && registered && Boolean(onChangePickup);

  if (!active) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy} aria-label={`Actions for ${row.name}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canResend && <DropdownMenuItem onClick={() => onResendInvite?.(row)}>Resend invitation</DropdownMenuItem>}
        {canRegister && <DropdownMenuItem onClick={() => onRegister?.(row)}>Register on behalf</DropdownMenuItem>}
        {canPickup && <DropdownMenuItem onClick={() => onChangePickup?.(row)}>Change pickup</DropdownMenuItem>}
        {(canResend || canRegister || canPickup) && <DropdownMenuSeparator />}
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemove(row)}>
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EventAllocatedTable({
  rows,
  isLoading,
  sizeUnit,
  onRemove,
  onRegister,
  onChangePickup,
  onResendInvite,
  removingId,
  busyId,
  emptyMessage = "No one has been invited yet.",
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
            <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard key={row.allocation_id} title={row.name} subtitle={row.email ?? undefined}>
                <AdminMobileField label="Attendance" value={<StatusBadge status={row.status} landStatus={row.allocation_status} />} />
                <AdminMobileField label="Size reserved" value={`${formatNumber(row.size_reserved)} ${unit}`} />
                <AdminMobileField label="Pickup" value={row.pickup_location ?? "—"} />
                <AdminMobileField label="Invited on" value={formatDate(row.created_at)} />
                <div className="flex justify-end border-t border-border pt-2">
                  <RowActions
                    row={row}
                    onRemove={onRemove}
                    onRegister={onRegister}
                    onChangePickup={onChangePickup}
                    onResendInvite={onResendInvite}
                    busy={removingId === row.allocation_id || busyId === row.allocation_id}
                  />
                </div>
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
                  Attendance
                </TableHead>
                <TableHead className="min-w-24 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Size
                </TableHead>
                <TableHead className="min-w-34 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Invited On
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
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.allocation_id}>
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
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                      <RowActions
                        row={row}
                        onRemove={onRemove}
                        onRegister={onRegister}
                        onChangePickup={onChangePickup}
                        onResendInvite={onResendInvite}
                        busy={removingId === row.allocation_id || busyId === row.allocation_id}
                      />
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
