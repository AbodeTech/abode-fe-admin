"use client";

import React from "react";
import type { AllocationClient } from "../schemas/allocation.schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, RotateCcw, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export type AllocationTableRow = Pick<
  AllocationClient,
  | "payment_plan_id"
  | "name"
  | "email"
  | "phone"
  | "asset_id"
  | "asset_name"
  | "asset_location"
  | "asset_type"
  | "size"
  | "no_of_units"
  | "amount_paid"
  | "amount_payable"
  | "balance"
  | "payment_percentage"
  | "allocation_status"
  | "allocation_date"
  | "date_joined"
>;

interface AllocationTableProps {
  rows?: AllocationTableRow[] | null;
  isLoading?: boolean;
  onSend: (client: AllocationTableRow) => void;
  onResend: (client: AllocationTableRow) => void;
}

const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("en-NG").format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const trimmed = value.trim();
  let normalizedValue: string | number = trimmed;
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    normalizedValue = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
  }
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const ALLOCATION_STATUS_LABELS: Record<AllocationTableRow["allocation_status"], string> = {
  pending: "Not assigned yet",
  allocated: "Allocated",
  email_sent: "Email sent",
};

function AllocationStatusBadge({ status }: { status: AllocationTableRow["allocation_status"] }) {
  if (status === "pending") {
    return (
      <Badge
        variant="secondary"
        className="inline-block max-w-full whitespace-normal bg-orange-100 px-2.5 py-1 text-left text-sm font-normal leading-snug text-orange-800"
      >
        {ALLOCATION_STATUS_LABELS[status]}
      </Badge>
    );
  }
  return (
    <Badge className="inline-block max-w-full wrap-break-word bg-green-100 px-2.5 py-1 text-left text-sm font-normal leading-snug text-green-800 hover:bg-green-100">
      {ALLOCATION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function AllocationTable({ rows, isLoading, onSend, onResend }: AllocationTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRows = rows ?? [];

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No eligible clients found.</p>
          ) : (
            safeRows.map((row, idx) => {
              const client = row;
              const hasAllocation = client.allocation_status !== "pending";
              return (
                <AdminMobileCard key={`${client.payment_plan_id}-${idx}`} title={client.name} subtitle={client.email}>
                  <AdminMobileField label="Phone" value={client.phone || "—"} />
                  <AdminMobileField
                    label="Asset"
                    value={client.asset_type ? `${client.asset_name} (${client.asset_type})` : client.asset_name}
                  />
                  <AdminMobileField label="Land size" value={formatNumber(client.size)} />
                  <AdminMobileField label="Units" value={formatNumber(client.no_of_units)} />
                  <AdminMobileField label="Payment %" value={`${client.payment_percentage}%`} />
                  <AdminMobileField label="Amount paid" value={formatAmount(client.amount_paid)} />
                  <AdminMobileField label="Amount payable" value={formatAmount(client.amount_payable)} />
                  <AdminMobileField label="Balance" value={formatAmount(client.balance)} />
                  <AdminMobileField label="Location" value={client.asset_location ?? "—"} />
                  <AdminMobileField label="Date joined" value={formatDate(client.date_joined)} />
                  <AdminMobileField
                    label="Allocation"
                    value={<AllocationStatusBadge status={client.allocation_status} />}
                  />
                  <div className="border-t border-border pt-2">
                    {hasAllocation ? (
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onResend(row)}>
                        <RotateCcw className="h-4 w-4" />
                        Resend
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full gap-2" onClick={() => onSend(row)}>
                        <Send className="h-4 w-4" />
                        Assign Plots
                      </Button>
                    )}
                  </div>
                </AdminMobileCard>
              );
            })
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
        <Table className="w-max min-w-[1420px] table-auto text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Client Name
              </TableHead>
              <TableHead className="min-w-52 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Asset Name
              </TableHead>
              <TableHead className="min-w-20 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Land Size
              </TableHead>
              <TableHead className="min-w-18 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Units
              </TableHead>
              <TableHead className="min-w-22 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment %
              </TableHead>
              <TableHead className="min-w-38 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount Paid
              </TableHead>
              <TableHead className="min-w-38 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount Payable
              </TableHead>
              <TableHead className="min-w-38 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Balance
              </TableHead>
              <TableHead className="min-w-48 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </TableHead>
              <TableHead className="min-w-34 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date Joined
              </TableHead>
              <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Allocation
              </TableHead>
              <TableHead className="min-w-38 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No eligible clients found.
                </TableCell>
              </TableRow>
            ) : (
              safeRows.map((row, idx) => {
                const client = row;
                const hasAllocation = client.allocation_status !== "pending";

                return (
                  <TableRow key={`${client.payment_plan_id}-${idx}`}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">{client.name}</span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {client.asset_type
                        ? `${client.asset_name} (${client.asset_type})`
                        : client.asset_name}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {formatNumber(client.size)}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {formatNumber(client.no_of_units)}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {client.payment_percentage}%
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 tabular-nums leading-relaxed wrap-break-word">
                      {formatAmount(client.amount_paid)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 tabular-nums leading-relaxed wrap-break-word">
                      {formatAmount(client.amount_payable)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 tabular-nums leading-relaxed wrap-break-word">
                      {formatAmount(client.balance)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <div className="flex min-w-0 items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 wrap-break-word">{client.asset_location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {formatDate(client.date_joined)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <AllocationStatusBadge status={client.allocation_status} />
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                      {hasAllocation ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex h-auto min-h-10 w-full flex-col gap-1.5 whitespace-normal px-3 py-2.5 text-center text-sm leading-snug sm:h-9 sm:min-h-0 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-2"
                          onClick={() => onResend(row)}
                        >
                          <RotateCcw className="h-4 w-4 shrink-0" />
                          Resend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex h-auto min-h-10 w-full flex-col gap-1.5 whitespace-normal px-3 py-2.5 text-center text-sm leading-snug sm:h-9 sm:min-h-0 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-2"
                          onClick={() => onSend(row)}
                        >
                          <Send className="h-4 w-4 shrink-0" />
                          Assign Plots
                        </Button>
                      )}
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
