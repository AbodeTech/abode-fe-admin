"use client";

import { approveDocumentTransaction, declineDocumentTransaction } from "@/lib/api/admin/transactions.client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { User, UserCheck, Building, CreditCard, DollarSign, Calendar, CheckCircle, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { TransactionAction } from "@/components/shared/TransactionAction";
import { ViewTransactionEvidence } from "../shared/ViewTransactionEvidence";
import { format } from "date-fns";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { DocumentTransactionsTable_DataFragment } from "@/lib/gql/graphql";
import { useAuthStore } from "@/store/auth-store";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export const DocumentTransactionsFragment = graphql(`
  fragment DocumentTransactionsTable_data on AdminTransactions {
    _id
    amount
    description
    admin_status
    plot_size
    asset_type
    referral
    transaction_type
    transfer_file {
      file
    }
    user {
      firstName
      lastName
      _id
    }
    time_of_transaction
  }
`);

const formatNumber = (amount: number | string) => {
  const num = Number(amount);
  return isNaN(num) ? "0" : num.toLocaleString();
};

const formatDateNumerical = (dateString: string) => {
  try {
    return format(new Date(dateString), "yyyy/MM/dd");
  } catch {
    return dateString;
  }
};

const updatedString = (str: string) => (str.includes("asset purchase") ? str.replace("asset purchase", "AP") : str);

interface DocumentTransactionsTableProps {
  data: (FragmentType<typeof DocumentTransactionsFragment> | null)[] | null | undefined;
  isLoading?: boolean;
}

const DECLINE_REASONS = [
  "Document Unclear",
  "Invalid Transaction Details",
  "Duplicate Transaction",
  "Insufficient Information",
];

export function DocumentTransactionsTable({ data, isLoading }: DocumentTransactionsTableProps) {
  const { user } = useAuthStore();
  const canManageDocumentTransactions =
    (user?.permissions ?? []).includes("asset_transactions") || user?.role === "admin";
  const transactionsRaw = data || [];
  const transactions = transactionsRaw.map((t) => getFragmentData(DocumentTransactionsFragment, t));

  const validTransactions = transactions.filter(
    (t): t is DocumentTransactionsTable_DataFragment => t !== null && t !== undefined
  );

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
  }

  if (!data || validTransactions.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No document transactions found</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no document transactions to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <AdminMobileStack className="space-y-3">
        {validTransactions.map((transaction) => (
          <AdminMobileCard
            key={transaction._id}
            title={
              <Link href={`/users/${transaction.user?._id ?? ""}`} className="text-primary hover:underline">
                {transaction.user?.lastName} {transaction.user?.firstName}
              </Link>
            }
          >
            <AdminMobileField label="Referrer" value={transaction.referral || "No Referrer"} />
            <AdminMobileField
              label="Property"
              value={`${transaction.asset_type || ""} - ${updatedString(`${transaction.description ?? ""}(${transaction.plot_size ?? ""}sqm)`)}`}
            />
            <AdminMobileField label="Transaction type" value={transaction.transaction_type ?? ""} />
            <AdminMobileField label="Amount" value={`₦${formatNumber(transaction.amount ?? 0)}`} />
            <AdminMobileField label="Date" value={formatDateNumerical(transaction.time_of_transaction ?? "")} />
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <TransactionStatus status={transaction.admin_status || undefined} />
            </div>
            {canManageDocumentTransactions && (
              <div className="pt-2">
                <TransactionAction
                  status={transaction.admin_status ?? ""}
                  transactionId={transaction._id ?? ""}
                  tag="documentTransactions"
                  declineReasons={DECLINE_REASONS}
                  onApprove={approveDocumentTransaction}
                  onDecline={declineDocumentTransaction}
                />
              </div>
            )}
            <div className="flex justify-end border-t border-border pt-2">
              {transaction.transfer_file ? (
                <ViewTransactionEvidence
                  image={transaction.transfer_file.file ?? undefined}
                  trigger={
                    <button type="button" className="rounded-md p-2 text-sm font-medium hover:bg-muted">
                      <Eye className="mr-1 inline h-4 w-4" />
                      Evidence
                    </button>
                  }
                />
              ) : (
                <span className="text-xs text-muted-foreground">No evidence</span>
              )}
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
      <Card className="border border-gray-200">
        <div className="min-w-0 w-full overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-gray-50 border-b border-gray-200">
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
                {canManageDocumentTransactions && <TableHead className="py-4 font-semibold w-[130px] text-center">Action</TableHead>}
                <TableHead className="py-4 font-semibold w-[100px] text-center">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validTransactions.map((transaction, idx) => (
                <TableRow
                  key={transaction._id}
                  className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 ${idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                    }`}
                >
                  <TableCell className="py-4 w-[120px]">
                    <Link
                      href={`/users/${transaction.user?._id ?? ""}`}
                      className="text-black hover:text-gray-700 font-medium hover:underline transition-colors truncate block"
                    >
                      {transaction.user?.lastName} {transaction.user?.firstName}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 w-[100px] truncate">
                    {transaction.referral || "No Referrer"}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 max-w-[220px] wrap-break-word whitespace-normal">
                    {transaction.asset_type || ""} - {updatedString(`${transaction.description ?? ""}(${transaction.plot_size ?? ""}sqm)`)}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 w-[100px]">{transaction.transaction_type ?? ""}</TableCell>
                  <TableCell className="py-4 font-semibold text-black w-[100px] whitespace-nowrap">
                    ₦{formatNumber(transaction.amount ?? 0)}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 w-[100px] whitespace-nowrap">
                    {formatDateNumerical(transaction.time_of_transaction ?? "")}
                  </TableCell>
                  <TableCell className="py-4">
                    <TransactionStatus status={transaction.admin_status || undefined} />
                  </TableCell>
                  {canManageDocumentTransactions && (
                    <TableCell className="py-4 w-[130px] text-center">
                      <TransactionAction
                        status={transaction.admin_status ?? ""}
                        transactionId={transaction._id ?? ""}
                        tag="documentTransactions"
                        declineReasons={DECLINE_REASONS}
                        onApprove={approveDocumentTransaction}
                        onDecline={declineDocumentTransaction}
                      />
                    </TableCell>
                  )}
                  <TableCell className="py-4 w-[100px] text-center">
                    {transaction.transfer_file ? (
                      <ViewTransactionEvidence
                        image={transaction.transfer_file.file ?? undefined}
                        trigger={
                          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                            <Eye className="w-5 h-5 text-gray-700" />
                          </button>
                        }
                      />
                    ) : (
                      <div className="p-2">
                        <Eye className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      </AdminDesktopTableWrap>
    </div>
  );
}
