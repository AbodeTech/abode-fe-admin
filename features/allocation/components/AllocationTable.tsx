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
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, RotateCcw, Send, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export type ClientAllocationStatus = "unassigned" | "assigned" | "allocated";

export function getClientAllocationStatus(client: {
  allocation?: string | null;
  allocationDate?: string | null;
}): ClientAllocationStatus {
  if (!client.allocation) return "unassigned";
  if (client.allocationDate) return "allocated";
  return "assigned";
}

interface AllocationTableProps {
  rows?: (FragmentType<typeof AllocationTableRowFragment> | null)[] | null;
  isLoading?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (paymentPlanId: string, checked: boolean) => void;
  onAssign: (client: FragmentType<typeof AllocationTableRowFragment>) => void;
  onAllocate: (client: FragmentType<typeof AllocationTableRowFragment>) => void;
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

export function AllocationTable({
  rows,
  isLoading,
  selectedIds,
  onSelectionChange,
  onAssign,
  onAllocate,
  onResend,
}: AllocationTableProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
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

  const assignedRows = safeRows.filter((row) => {
    const client = getFragmentData(AllocationTableRowFragment, row);
    return getClientAllocationStatus(client) === "assigned";
  });

  const allAssignedSelected =
    assignedRows.length > 0 &&
    assignedRows.every((row) => {
      const client = getFragmentData(AllocationTableRowFragment, row);
      return client.paymentPlan ? selectedIds?.has(client.paymentPlan) : false;
    });

  const handleSelectAll = (checked: boolean) => {
    assignedRows.forEach((row) => {
      const client = getFragmentData(AllocationTableRowFragment, row);
      if (client.paymentPlan) {
        onSelectionChange?.(client.paymentPlan, checked);
      }
    });
  };

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {assignedRows.length > 0 && (
                    <Checkbox
                      checked={allAssignedSelected}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Select all assigned"
                    />
                  )}
                </TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Land Size</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Payment %</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Bought Date</TableHead>
                <TableHead>Allocation #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center text-sm text-muted-foreground">
                    No eligible clients found.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row, idx) => {
                  const client = getFragmentData(AllocationTableRowFragment, row);
                  const status = getClientAllocationStatus(client);
                  const isSelectable = status === "assigned";
                  const isSelected = client.paymentPlan ? selectedIds?.has(client.paymentPlan) : false;

                  return (
                    <TableRow
                      key={`${client.email}-${idx}`}
                      data-state={isSelected ? "selected" : undefined}
                      className={isSelected ? "bg-muted/40" : undefined}
                    >
                      <TableCell>
                        {isSelectable && client.paymentPlan && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              onSelectionChange?.(client.paymentPlan!, Boolean(checked))
                            }
                            aria-label={`Select ${client.firstName} ${client.lastName}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] text-wrap">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell>{client.referral || "not added yet"}</TableCell>
                      <TableCell>
                        {client.assetType
                          ? `${client.assetName} (${client.assetType})`
                          : client.assetName}
                      </TableCell>
                      <TableCell>{formatNumber(client.assetSize)}</TableCell>
                      <TableCell>{formatNumber(client.unit)}</TableCell>
                      <TableCell>{client.paymentPercentage ?? "—"}%</TableCell>
                      <TableCell>{formatAmount(client.amountPaid)}</TableCell>
                      <TableCell>{formatAmount(client.totalPrice)}</TableCell>
                      <TableCell>{client.duration} months</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{client.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(client.end_date)}</TableCell>
                      <TableCell>
                        {client.allocation ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {client.allocation}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Not assigned yet
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {status === "unassigned" && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                            Unassigned
                          </Badge>
                        )}
                        {status === "assigned" && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">
                            Assigned
                          </Badge>
                        )}
                        {status === "allocated" && (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs">
                            Allocated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {status === "unassigned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => onAssign(row)}
                          >
                            <ClipboardList className="h-4 w-4" />
                            Assign
                          </Button>
                        )}
                        {status === "assigned" && (
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onAllocate(row)}
                          >
                            <Send className="h-4 w-4" />
                            Allocate
                          </Button>
                        )}
                        {status === "allocated" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onResend(row)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Resend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
