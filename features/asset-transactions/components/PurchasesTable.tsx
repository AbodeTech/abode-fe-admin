"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  User,
  UserCheck,
  Building,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Eye,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionStatus } from "@/components/shared/TransactionStatus";

import {
  adminStatusForBadge,
  isReviewablePurchase,
  payerDisplayName,
  propertyNameDisplay,
  propertyOwnerLabel,
  referrerName,
  transferReceiptUrl,
  transactionMethodLabel,
  type Purchase,
} from "../schemas/purchase.schema";
import { AssetTransactionAction } from "./AssetTransactionAction";
import { ViewTransactionEvidence } from "./ViewTransactionEvidence";

function formatNumber(amount: number) {
  return Number.isFinite(amount) ? amount.toLocaleString() : "0";
}

function formatDateNumerical(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "yyyy/MM/dd");
  } catch {
    return value;
  }
}

function referrerDisplay(row: Purchase): string {
  const name = referrerName(row.user);
  return name || "No Referrer";
}

interface Props {
  rows: Purchase[];
  isLoading: boolean;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
  /** The document ledger renders the same row shape under its own name. */
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Hides the Action column outright. The document screen gates it on the
   * `asset_transactions` permission, as its own table always did.
   */
  canReview?: boolean;
}

export function PurchasesTable({
  rows,
  isLoading,
  onApprove,
  onDecline,
  emptyTitle = "No asset transactions found",
  emptyDescription = "There are no asset transactions to display at this time.",
  canReview = true,
}: Props) {
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
  }

  if (rows.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{emptyTitle}</h3>
          <p className="max-w-md text-center text-gray-600">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-4 p-4 lg:hidden">
        {rows.map((row) => (
          <MobileTransactionCard
            key={row._id}
            row={row}
            canReview={canReview}
            onApprove={onApprove}
            onDecline={onDecline}
          />
        ))}
      </div>

      <div className="hidden lg:block">
        <Card className="border border-gray-200 pt-0">
          <div className="min-w-0 w-full overflow-x-auto">
            <Table className="min-w-[1150px]">
              <TableHeader className="border-b border-gray-200 bg-gray-50">
                <TableRow className="text-sm font-bold text-black">
                  <TableHead className="py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Payer
                    </div>
                  </TableHead>
                  <TableHead className="py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Referrer
                    </div>
                  </TableHead>
                  <TableHead className="py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Property Owner
                    </div>
                  </TableHead>
                  <TableHead className="py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Property Name
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
                      <Calendar className="h-4 w-4" />
                      Date
                    </div>
                  </TableHead>
                  <TableHead className="py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  {canReview ? (
                    <TableHead className="py-4 font-semibold">Action</TableHead>
                  ) : null}
                  <TableHead className="py-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const receipt = transferReceiptUrl(row);
                  const reviewable = isReviewablePurchase(row);
                  const adminStatus = row.admin_status ?? "pending";

                  return (
                    <TableRow
                      key={row._id}
                      className={`border-gray-200 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 ${
                        index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                      }`}
                    >
                      <TableCell className="w-30 py-4">
                        <PayerLink row={row} />
                      </TableCell>
                      <TableCell className="w-25 truncate py-4 text-gray-700">
                        {referrerDisplay(row)}
                      </TableCell>
                      <TableCell className="max-w-30 truncate py-4 text-gray-700">
                        {propertyOwnerLabel(row) ?? "—"}
                      </TableCell>
                      <TableCell className="w-50 max-w-50 overflow-hidden py-4 whitespace-normal wrap-break-word text-gray-700">
                        {propertyNameDisplay(row)}
                      </TableCell>
                      <TableCell className="z-15 min-w-30 py-4 text-center whitespace-nowrap text-gray-700">
                        {transactionMethodLabel(row)}
                      </TableCell>
                      <TableCell className="w-25 py-4 font-semibold whitespace-nowrap text-black">
                        ₦{formatNumber(row.amount)}
                      </TableCell>
                      <TableCell className="w-25 py-4 whitespace-nowrap text-gray-700">
                        {formatDateNumerical(row.createdAt)}
                      </TableCell>
                      <TableCell className="py-4">
                        <TransactionStatus status={adminStatusForBadge(row)} />
                      </TableCell>
                      {canReview ? (
                        <TableCell className="py-4">
                          {reviewable ? (
                            <AssetTransactionAction
                              status="pending"
                              assetId={row._id}
                              onApprove={onApprove}
                              onDecline={onDecline}
                            />
                          ) : adminStatus.toLowerCase() !== "pending" ? (
                            <AssetTransactionAction
                              status={adminStatus}
                              assetId={row._id}
                              onApprove={onApprove}
                              onDecline={onDecline}
                            />
                          ) : null}
                        </TableCell>
                      ) : null}
                      <TableCell className="py-4">
                        {receipt ? (
                          <ViewTransactionEvidence
                            image={receipt}
                            trigger={
                              <button
                                type="button"
                                className="rounded-md p-2 transition-colors hover:bg-gray-100"
                              >
                                <Eye className="h-5 w-5 text-gray-700" />
                              </button>
                            }
                          />
                        ) : (
                          <div className="p-2">
                            <Eye className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PayerLink({ row }: { row: Purchase }) {
  const user = row.user;
  const id = typeof user === "string" ? user : user?._id;

  if (!id) {
    return <span className="truncate font-medium text-black">{payerDisplayName(row)}</span>;
  }

  return (
    <Link
      href={`/users/${id}`}
      className="block truncate font-medium text-black transition-colors hover:text-gray-700 hover:underline"
    >
      {payerDisplayName(row)}
    </Link>
  );
}

function MobileTransactionCard({
  row,
  canReview,
  onApprove,
  onDecline,
}: {
  row: Purchase;
  canReview: boolean;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
}) {
  const receipt = transferReceiptUrl(row);
  const reviewable = isReviewablePurchase(row);
  const adminStatus = row.admin_status ?? "pending";

  return (
    <Card className="border border-gray-200 transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <User className="h-4 w-4" />
            <PayerLink row={row} />
          </CardTitle>
          <TransactionStatus status={adminStatusForBadge(row)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Amount</span>
          </div>
          <span className="text-xl font-bold text-black">₦{formatNumber(row.amount)}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Building className="mt-1 h-4 w-4 shrink-0 text-gray-600" />
            <div className="flex-1">
              <span className="text-sm text-gray-600">Property</span>
              <p className="text-sm font-medium wrap-break-word text-gray-900">
                {propertyNameDisplay(row)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              Type
            </span>
            <span className="text-sm font-medium text-gray-900">{transactionMethodLabel(row)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              Property Owner
            </span>
            <span className="text-sm font-medium text-gray-900">
              {propertyOwnerLabel(row) ?? "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <UserCheck className="h-4 w-4" />
              Referrer
            </span>
            <span className="text-sm font-medium text-gray-900">{referrerDisplay(row)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Date
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatDateNumerical(row.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          {receipt ? (
            <ViewTransactionEvidence
              image={receipt}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <Eye className="h-4 w-4" />
                  View Evidence
                </button>
              }
            />
          ) : (
            <span />
          )}
          {canReview && reviewable ? (
            <AssetTransactionAction
              status="pending"
              assetId={row._id}
              onApprove={onApprove}
              onDecline={onDecline}
            />
          ) : canReview && adminStatus.toLowerCase() !== "pending" ? (
            <AssetTransactionAction
              status={adminStatus}
              assetId={row._id}
              onApprove={onApprove}
              onDecline={onDecline}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
