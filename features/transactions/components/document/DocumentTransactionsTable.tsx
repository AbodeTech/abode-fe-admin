"use client";

import { DocumentTransaction } from "@/lib/api/admin/transactions.types";
import { approveDocumentTransaction, declineDocumentTransaction } from "@/lib/api/admin/transactions.client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, UserCheck, Building, CreditCard, DollarSign, Calendar, CheckCircle, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { TransactionAction } from "@/components/shared/TransactionAction";
import { ViewTransactionEvidence } from "../assets/ViewTransactionEvidence";
import { format } from "date-fns";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { DocumentTransactionsTable_DataFragment } from "@/lib/gql/graphql";

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
  filterQuery?: string;
}

const DECLINE_REASONS = [
  "Document Unclear",
  "Invalid Transaction Details",
  "Duplicate Transaction",
  "Insufficient Information",
];

export function DocumentTransactionsTable({ data, isLoading, filterQuery = "" }: DocumentTransactionsTableProps) {
  const transactionsRaw = data || [];
  const transactions = transactionsRaw.map(t => useFragment(DocumentTransactionsFragment, t));

  const validTransactions = transactions
    .filter((t): t is DocumentTransactionsTable_DataFragment => t !== null && t !== undefined)
    .filter((tx) => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const first = tx.user?.firstName?.toLowerCase() ?? "";
      const last = tx.user?.lastName?.toLowerCase() ?? "";
      return first.includes(q) || last.includes(q);
    });

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
      <Card className="border border-gray-200">
        <ScrollArea className="w-full">
          <Table>
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
                <TableHead className="py-4 font-semibold">Action</TableHead>
                <TableHead className="py-4 font-semibold">
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
                  <TableCell className="py-4 text-gray-700 w-[220px]">
                    <div className="truncate" title={`${transaction.asset_type || ""} - ${updatedString(`${transaction.description ?? ""}(${transaction.plot_size ?? ""}sqm)`)}`}>
                      {transaction.asset_type || ""} - {updatedString(`${transaction.description ?? ""}(${transaction.plot_size ?? ""}sqm)`)}
                    </div>
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
                  <TableCell className="py-4">
                    <TransactionAction
                      status={transaction.admin_status ?? ""}
                      transactionId={transaction._id ?? ""}
                      tag="documentTransactions"
                      declineReasons={DECLINE_REASONS}
                      onApprove={approveDocumentTransaction}
                      onDecline={declineDocumentTransaction}
                    />
                  </TableCell>
                  <TableCell className="py-4">
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
        </ScrollArea>
      </Card>
    </div>
  );
}
