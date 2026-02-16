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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export function AllocationTable({
  rows,
  isLoading,
  onSend,
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

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-sm text-muted-foreground">
                    No eligible clients found.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row, idx) => {
                  const client = getFragmentData(AllocationTableRowFragment, row);
                  const isAllocated = Boolean(client.allocation);
                  return (
                    <TableRow key={`${client.email}-${idx}`}>
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
                        {isAllocated ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onResend(row)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Resend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onSend(row)}
                          >
                            <Send className="h-4 w-4" />
                            Send Allocation
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
