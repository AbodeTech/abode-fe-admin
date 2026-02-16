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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export const UpgradeRowFragment = graphql(`
  fragment UpgradeRowFragment on ReferralUpgrade {
    _id
    admin_status
    createdAt
    fee_amount
    transaction_type
    user_upgrade_type
    file_Url
    user {
      _id
      firstName
      lastName
      email
    }
    associate {
      _id
      firstName
      lastName
      email
    }
  }
`);

interface UpgradeTableProps {
  data?: (FragmentType<typeof UpgradeRowFragment> | null)[] | null;
  onApprove: (row: FragmentType<typeof UpgradeRowFragment>) => void;
  onDecline: (row: FragmentType<typeof UpgradeRowFragment>) => void;
}

const statusTone: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  declined: "bg-rose-100 text-rose-800",
};

const formatNaira = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export function UpgradeTable({ data, onApprove, onDecline }: UpgradeTableProps) {
  const safeRows = (data ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <Card className="border border-gray-200 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Referral</TableHead>
            <TableHead>Upgrade Type</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                No upgrade requests found.
              </TableCell>
            </TableRow>
          ) : (
            safeRows.map((row, idx) => {
              const upgrade = getFragmentData(UpgradeRowFragment, row);
              const status = (upgrade.admin_status || "").toLowerCase();
              return (
                <TableRow key={upgrade._id || idx}>
                  <TableCell className="font-medium">
                    {upgrade.user?.firstName} {upgrade.user?.lastName}
                    <div className="text-xs text-muted-foreground">{upgrade.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    {upgrade.associate?.firstName} {upgrade.associate?.lastName}
                    <div className="text-xs text-muted-foreground">{upgrade.associate?.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{upgrade.user_upgrade_type}</TableCell>
                  <TableCell className="capitalize">{upgrade.transaction_type}</TableCell>
                  <TableCell>{formatNaira(upgrade.fee_amount as number)}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${statusTone[status] || "bg-slate-100 text-slate-800"}`}>
                      {upgrade.admin_status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(upgrade.createdAt)}</TableCell>
                  <TableCell className="flex items-center gap-2 justify-end">
                    {status === "pending" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onApprove(row)}
                          aria-label="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDecline(row)}
                          aria-label="Decline"
                        >
                          <XCircle className="h-4 w-4 text-rose-600" />
                        </Button>
                      </>
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full ${status === "approved" ? "bg-emerald-500" : "bg-rose-500"}`}
                      />
                    )}
                    {upgrade.file_Url && (
                      <Button variant="outline" size="icon" asChild aria-label="View evidence">
                        <Link href={upgrade.file_Url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
