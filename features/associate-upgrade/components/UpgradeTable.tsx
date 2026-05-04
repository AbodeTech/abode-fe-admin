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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  CreditCard,
  DollarSign,
  CheckCircle,
  Eye,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { TransactionStatus } from "@/components/shared/TransactionStatus";

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

export function UpgradeTable({ data, onApprove, onDecline }: UpgradeTableProps) {
  const { user } = useAuthStore();
  const canManageUpgrade = (user?.permissions ?? []).includes("withdrawals") || user?.role === "admin";
  const safeRows = (data ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  if (safeRows.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upgrade Requests found</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no Upgrade Requests to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 overflow-x-auto pt-0!">
      <Table>
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow className="text-sm font-bold text-black whitespace-nowrap">
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Referral
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                User Upgrade Type
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transaction Type
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created At
              </div>
            </TableHead>
            {canManageUpgrade && <TableHead className="py-4 font-semibold">Action</TableHead>}
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeRows.map((row, idx) => {
            const upgrade = getFragmentData(UpgradeRowFragment, row);
            const status = (upgrade.admin_status || "").toLowerCase();
            return (
              <TableRow
                key={upgrade._id || idx}
                className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 whitespace-nowrap ${idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
              >
                <TableCell className="py-4">
                  <Link
                    href={`/admin/dashboard/user/${upgrade.user?._id ?? ""}`}
                    className="text-black hover:text-gray-700 font-medium hover:underline transition-colors"
                  >
                    {upgrade.user?.lastName} {upgrade.user?.firstName}
                  </Link>
                </TableCell>
                <TableCell className="py-4 text-gray-700">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/admin/dashboard/user/${upgrade.associate?._id ?? ""}`}
                      className="text-black hover:text-gray-700 font-medium hover:underline transition-colors"
                    >
                      {upgrade.associate?.firstName} {upgrade.associate?.lastName || "N/A"}
                    </Link>
                    <span className="text-xs text-gray-500">{upgrade.associate?.email || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-gray-700">{upgrade.user_upgrade_type || "N/A"}</TableCell>
                <TableCell className="py-4 text-gray-700">{upgrade.transaction_type || "N/A"}</TableCell>
                <TableCell className="py-4 text-gray-700">{upgrade.fee_amount || "N/A"}</TableCell>
                <TableCell className="py-4 text-gray-700">
                  <TransactionStatus status={upgrade.admin_status || undefined} />
                </TableCell>
                <TableCell className="py-4 text-gray-700 whitespace-nowrap">
                  {upgrade.createdAt ? new Date(upgrade.createdAt).toLocaleDateString() : "N/A"}
                </TableCell>
                {canManageUpgrade && (
                  <TableCell className="py-4">
                    {status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onApprove(row)} aria-label="Approve">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDecline(row)} aria-label="Decline">
                          <XCircle className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className={`w-6 h-2 rounded-2xl ${status === "approved" ? "bg-[#067647]" : "bg-[#B42318]"}`} />
                    )}
                  </TableCell>
                )}
                <TableCell className="py-4">
                  {upgrade.file_Url ? (
                    <Button variant="ghost" size="icon" asChild aria-label="View evidence">
                      <Link href={upgrade.file_Url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-5 h-5 text-gray-700" />
                      </Link>
                    </Button>
                  ) : (
                    <div className="p-2">
                      <Eye className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
