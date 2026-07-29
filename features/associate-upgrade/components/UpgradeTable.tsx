"use client";

import React from "react";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import type { UpgradeRowFragmentFragment } from "@/lib/gql/graphql";
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
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { AdminDesktopTableWrap, AdminMobileCard, AdminMobileField, AdminMobileStack } from "@/components/shared/admin-responsive-table";
import { ViewTransactionEvidence } from "@/features/transactions";

// NOTE: codegen silently drops this fragment's overload mapping in some
// build envs (Vercel + stricter TS), so `typeof UpgradeRowFragment` would
// resolve to `unknown` and break `FragmentType<typeof …>` below. Cast it
// explicitly to the codegen-generated fragment type. Same workaround
// pattern as commit 16038d7.
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
      phoneNumber
    }
    associate {
      _id
      firstName
      lastName
      email
      phoneNumber
    }
  }
`) as unknown as TypedDocumentNode<UpgradeRowFragmentFragment, unknown>;

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
    <Card className="min-w-0 overflow-hidden border border-gray-200 pt-0">
      <AdminMobileStack className="p-3 pt-4">
        {safeRows.map((row, idx) => {
          const upgrade = getFragmentData(UpgradeRowFragment, row);
          const status = (upgrade.admin_status || "").toLowerCase();
          return (
            <AdminMobileCard
              key={upgrade._id || idx}
              title={
                <Link
                  href={`/users/${upgrade.user?._id ?? ""}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {upgrade.user?.lastName} {upgrade.user?.firstName}
                </Link>
              }
            >
              <AdminMobileField
                label="Referral"
                value={
                  <span className="block text-right">
                    <Link
                      href={`/users/${upgrade.associate?._id ?? ""}`}
                      className="font-medium text-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {upgrade.associate?.lastName} {upgrade.associate?.firstName || "N/A"}
                    </Link>
                  </span>
                }
              />
              <AdminMobileField label="User phone" value={upgrade.user?.phoneNumber || "—"} />
              <AdminMobileField label="Referral phone" value={upgrade.associate?.phoneNumber || "—"} />
              <AdminMobileField label="Upgrade type" value={upgrade.user_upgrade_type || "N/A"} />
              <AdminMobileField label="Transaction type" value={upgrade.transaction_type || "N/A"} />
              <AdminMobileField label="Amount" value={upgrade.fee_amount ?? "N/A"} />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <TransactionStatus status={upgrade.admin_status || undefined} />
              </div>
              <AdminMobileField
                label="Created"
                value={upgrade.createdAt ? new Date(upgrade.createdAt).toLocaleDateString() : "N/A"}
              />
              {canManageUpgrade && (
                <div className="flex items-center justify-between border-t border-[#E5EAEF] pt-2">
                  <span className="text-sm text-muted-foreground">Actions</span>
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
                    <div className={`h-2 w-6 rounded-2xl ${status === "approved" ? "bg-[#067647]" : "bg-[#B42318]"}`} />
                  )}
                </div>
              )}
              <div className="flex justify-end">
                {upgrade.file_Url ? (
                  <ViewTransactionEvidence
                    image={upgrade.file_Url}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        Evidence
                      </Button>
                    }
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No evidence file</span>
                )}
              </div>
            </AdminMobileCard>
          );
        })}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 w-full overflow-x-auto">
          <Table className="min-w-[1360px]">
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
                    <Phone className="h-4 w-4" />
                    User phone
                  </div>
                </TableHead>
                <TableHead className="py-4 font-semibold">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Referral phone
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
                    className={`border-gray-200 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 ${idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                  >
                    <TableCell className="max-w-[220px] py-4 text-gray-700">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/users/${upgrade.user?._id ?? ""}`}
                          className="font-medium text-black transition-colors hover:text-gray-700 hover:underline"
                        >
                          {upgrade.user?.lastName} {upgrade.user?.firstName || "N/A"}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px] py-4 text-gray-700">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/users/${upgrade.associate?._id ?? ""}`}
                          className="font-medium text-black transition-colors hover:text-gray-700 hover:underline"
                        >
                          {upgrade.associate?.lastName} {upgrade.associate?.firstName || "N/A"}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px] whitespace-normal wrap-break-word py-4 text-gray-700">
                      {upgrade.user?.phoneNumber || "—"}
                    </TableCell>
                    <TableCell className="max-w-[140px] whitespace-normal wrap-break-word py-4 text-gray-700">
                      {upgrade.associate?.phoneNumber || "—"}
                    </TableCell>
                    <TableCell className="max-w-[140px] whitespace-normal wrap-break-word py-4 text-gray-700">
                      {upgrade.user_upgrade_type || "N/A"}
                    </TableCell>
                    <TableCell className="max-w-[120px] whitespace-normal wrap-break-word py-4 text-gray-700">
                      {upgrade.transaction_type || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 text-gray-700 whitespace-nowrap">{upgrade.fee_amount || "N/A"}</TableCell>
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
                        <ViewTransactionEvidence
                          image={upgrade.file_Url}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="View evidence">
                              <Eye className="w-5 h-5 text-gray-700" />
                            </Button>
                          }
                        />
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
        </div>
      </AdminDesktopTableWrap>
    </Card>
  );
}
