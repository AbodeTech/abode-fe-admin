"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { User, CreditCard, DollarSign, Calendar, CheckCircle, Eye, Upload } from "lucide-react";
import Link from "next/link";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { TransactionAction } from "@/components/shared/TransactionAction";
import { ViewTransactionEvidence } from "../assets/ViewTransactionEvidence";
import { format } from "date-fns";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { useAuthStore } from "@/store/auth-store";

export const TopupTransactionsFragment = graphql(`
  fragment TopupTransactionsTable_data on AdminTransactions {
    _id
    amount
    status
    admin_status
    time_of_transaction
    transaction_type
    transfer_file {
      file
    }
    user {
      firstName
      lastName
      _id
    }
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

interface TopupTransactionsTableProps {
  data: (FragmentType<typeof TopupTransactionsFragment> | null)[] | null | undefined;
  isLoading?: boolean;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
  filterQuery?: string;
}

const DECLINE_REASONS = [
  "Incomplete Information",
  "Account Restrictions",
  "Duplicate Transaction",
  "Suspicious Activity",
];

export function TopupTransactionsTable({ data, isLoading, onApprove, onDecline, filterQuery = "" }: TopupTransactionsTableProps) {
  const { user } = useAuthStore();
  const canManageTopup = user?.role === "admin";
  const nonNullData = (data || []).filter((t): t is FragmentType<typeof TopupTransactionsFragment> => t !== null);
  const validTransactions = useFragment(TopupTransactionsFragment, nonNullData).filter((tx) => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const first = tx.user?.firstName?.toLowerCase() ?? "";
      const last = tx.user?.lastName?.toLowerCase() ?? "";
      const fullName = `${first} ${last}`.trim();
      return first.includes(q) || last.includes(q) || fullName.includes(q);
    });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
  }

  if (!data || validTransactions.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No top-ups found</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no top-up transactions to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table Layout */}
      <Card className="border border-gray-200 pt-0">
        <div className="min-w-0 w-full overflow-x-auto">
          <Table className="min-w-[920px]">
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
                    <CreditCard className="h-4 w-4" />
                    Type
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
                {canManageTopup && <TableHead className="py-4 font-semibold">Action</TableHead>}
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
                  <TableCell className="py-4 w-[150px]">
                    <Link
                      href={`/users/${transaction.user?._id ?? ""}`}
                      className="text-black hover:text-gray-700 font-medium hover:underline transition-colors"
                    >
                      {transaction.user?.lastName} {transaction.user?.firstName}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">{transaction.transaction_type ?? ""}</TableCell>
                  <TableCell className="py-4 font-semibold text-black whitespace-nowrap">
                    ₦{formatNumber(transaction.amount ?? 0)}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 whitespace-nowrap">
                    {formatDateNumerical(transaction.time_of_transaction ?? "")}
                  </TableCell>
                  <TableCell className="py-4">
                    <TransactionStatus status={transaction.admin_status || undefined} />
                  </TableCell>
                  {canManageTopup && (
                    <TableCell className="py-4">
                      <TransactionAction
                        status={transaction.admin_status ?? ""}
                        transactionId={transaction._id ?? ""}
                        tag="topupTransactions"
                        declineReasons={DECLINE_REASONS}
                        onApprove={onApprove}
                        onDecline={onDecline}
                      />
                    </TableCell>
                  )}
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
        </div>
      </Card>
    </div>
  );
}
