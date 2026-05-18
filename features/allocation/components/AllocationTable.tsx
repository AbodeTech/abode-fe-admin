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
import { MapPin, RotateCcw, Send, Mail } from "lucide-react";
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
  onSendEmail: (client: FragmentType<typeof AllocationTableRowFragment>) => void;
  onResend: (client: FragmentType<typeof AllocationTableRowFragment>) => void;
  sendingEmailPaymentPlanId?: string | null;
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

function AllocationStatusCell({
  status,
  allocation,
}: {
  status: "pending" | "allocated" | "email_sent";
  allocation: string | null;
}) {
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Not assigned yet
      </Badge>
    );
  }
  if (status === "allocated") {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit">
          Allocated · email not sent
        </Badge>
        {allocation && (
          <span className="text-[11px] text-muted-foreground">{allocation}</span>
        )}
      </div>
    );
  }
  // email_sent
  return (
    <div className="flex flex-col gap-1">
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 w-fit">
        Email sent
      </Badge>
      {allocation && (
        <span className="text-[11px] text-muted-foreground">{allocation}</span>
      )}
    </div>
  );
}

export function AllocationTable({
  rows,
  isLoading,
  onSend,
  onSendEmail,
  onResend,
  sendingEmailPaymentPlanId,
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
                  const status = (client.allocationStatus ?? "pending") as
                    | "pending"
                    | "allocated"
                    | "email_sent";
                  const isSendingEmail =
                    sendingEmailPaymentPlanId === client.paymentPlan &&
                    !!client.paymentPlan;

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
                        <AllocationStatusCell
                          status={status}
                          allocation={client.allocation ?? null}
                        />
                      </TableCell>
                      <TableCell>
                        {status === "pending" && (
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onSend(row)}
                          >
                            <Send className="h-4 w-4" />
                            Send Allocation
                          </Button>
                        )}
                        {status === "allocated" && (
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onSendEmail(row)}
                            disabled={isSendingEmail}
                          >
                            {isSendingEmail ? (
                              <>
                                <RotateCcw className="h-4 w-4 animate-spin" />
                                Sending…
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4" />
                                Send Email
                              </>
                            )}
                          </Button>
                        )}
                        {status === "email_sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onResend(row)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Resend / Manage
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
