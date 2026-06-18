"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
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

export const AllocationTableRowFragment = graphql(`
  fragment AllocationTableRowFragment on EligibleClient {
    allocation
    allocationStatus
    allocationDate
    amountPaid
    assetName
    assetSize
    assetType
    duration
    email
    end_date
    firstName
    lastName
    location
    paymentPlan
    paymentPercentage
    phoneNumber
    referral
    referralStatus
    totalPrice
    unit
  }
`);

interface AllocationTableProps {
  rows?: (FragmentType<typeof AllocationTableRowFragment> | null)[] | null;
  isLoading?: boolean;
  onSend: (client: FragmentType<typeof AllocationTableRowFragment>) => void;
  onResend: (client: FragmentType<typeof AllocationTableRowFragment>) => void;
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

  const safeRows = (rows ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No eligible clients found.</p>
          ) : (
            safeRows.map((row, idx) => {
              const client = getFragmentData(AllocationTableRowFragment, row);
              const hasAllocation = Boolean(client.allocation);
              return (
                <AdminMobileCard key={`${client.email}-${idx}`} title={`${client.firstName} ${client.lastName}`} subtitle={client.email}>
                  <AdminMobileField label="Phone" value={client.phoneNumber || "—"} />
                  <AdminMobileField label="Referrer" value={client.referral || "not added yet"} />
                  <AdminMobileField
                    label="Asset"
                    value={client.assetType ? `${client.assetName} (${client.assetType})` : (client.assetName ?? "—")}
                  />
                  <AdminMobileField label="Land size" value={formatNumber(client.assetSize)} />
                  <AdminMobileField label="Units" value={formatNumber(client.unit)} />
                  <AdminMobileField label="Payment %" value={`${client.paymentPercentage ?? "—"}%`} />
                  <AdminMobileField label="Amount paid" value={formatAmount(client.amountPaid)} />
                  <AdminMobileField label="Total price" value={formatAmount(client.totalPrice)} />
                  <AdminMobileField label="Duration" value={`${client.duration} months`} />
                  <AdminMobileField label="Location" value={client.location ?? "—"} />
                  <AdminMobileField label="Bought date" value={formatDate(client.end_date)} />
                  <AdminMobileField
                    label="Allocation"
                    value={
                      hasAllocation ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{client.allocation}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Not assigned yet
                        </Badge>
                      )
                    }
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
        <Table className="w-max min-w-[1520px] table-auto text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Client Name
              </TableHead>
              <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Referrer
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
                Total Price
              </TableHead>
              <TableHead className="min-w-26 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Duration
              </TableHead>
              <TableHead className="min-w-48 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </TableHead>
              <TableHead className="min-w-34 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bought Date
              </TableHead>
              <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Allocation #
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
                  colSpan={13}
                  className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No eligible clients found.
                </TableCell>
              </TableRow>
            ) : (
              safeRows.map((row, idx) => {
                const client = getFragmentData(AllocationTableRowFragment, row);
                const hasAllocation = Boolean(client.allocation);

                return (
                  <TableRow key={`${client.email}-${idx}`}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">
                        {client.firstName} {client.lastName}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {client.referral || "not added yet"}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {client.assetType
                        ? `${client.assetName} (${client.assetType})`
                        : client.assetName}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {formatNumber(client.assetSize)}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {formatNumber(client.unit)}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {client.paymentPercentage ?? "—"}%
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 tabular-nums leading-relaxed wrap-break-word">
                      {formatAmount(client.amountPaid)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 tabular-nums leading-relaxed wrap-break-word">
                      {formatAmount(client.totalPrice)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {client.duration} months
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <div className="flex min-w-0 items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 wrap-break-word">{client.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {formatDate(client.end_date)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      {hasAllocation ? (
                        <Badge className="inline-block max-w-full wrap-break-word bg-green-100 px-2.5 py-1 text-left text-sm font-normal leading-snug text-green-800 hover:bg-green-100">
                          {client.allocation}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="inline-block max-w-full whitespace-normal bg-orange-100 px-2.5 py-1 text-left text-sm font-normal leading-snug text-orange-800"
                        >
                          Not assigned yet
                        </Badge>
                      )}
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
