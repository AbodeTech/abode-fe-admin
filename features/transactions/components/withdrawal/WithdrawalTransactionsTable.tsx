"use client";

import { WithdrawalTransaction } from "@/lib/api/admin/transactions.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Hash, CreditCard, DollarSign, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { TransactionAction } from "@/components/shared/TransactionAction";
import { format } from "date-fns";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { WithdrawalTransactionsTable_DataFragment } from "@/lib/gql/graphql";

export const WithdrawalTransactionsFragment = graphql(`
  fragment WithdrawalTransactionsTable_data on AdminTransactions {
    _id
    admin_status
    amount
    time_of_transaction
    tin
    bank_details {
      accountNumber
      bankName
      name
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

interface WithdrawalTransactionsTableProps {
  data: (FragmentType<typeof WithdrawalTransactionsFragment> | null)[] | null | undefined;
  isLoading?: boolean;
  onApprove: (id: string) => Promise<any>;
  onDecline: (id: string, message: string) => Promise<any>;
  filterQuery?: string;
}

const DECLINE_REASONS = [
  "Invalid Account Details",
  "Account Restrictions",
  "System Error",
  "Duplicate Request",
  "Compliance Issue",
];

export function WithdrawalTransactionsTable({ data, isLoading, onApprove, onDecline, filterQuery = "" }: WithdrawalTransactionsTableProps) {
  const transactionsRaw = data || [];
  const transactions = transactionsRaw.map(t => useFragment(WithdrawalTransactionsFragment, t));

  const validTransactions = transactions
    .filter((t): t is WithdrawalTransactionsTable_DataFragment => t !== null && t !== undefined)
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
          <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No withdrawals found</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no withdrawal transactions to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card className="border border-gray-200 pt-0! mt-0!">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow className="text-sm font-bold text-black">
                <TableHead className="py-0! font-semibold">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Payer
                  </div>
                </TableHead>
                <TableHead className="py-4 font-semibold">TIN</TableHead>
                <TableHead className="py-4 font-semibold">Bank</TableHead>
                <TableHead className="py-4 font-semibold">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Account Number
                  </div>
                </TableHead>
                <TableHead className="py-4 font-semibold">Account Name</TableHead>
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
                  <TableCell className="py-4 text-gray-700">{transaction.tin || "N/A"}</TableCell>
                  <TableCell className="py-4 text-gray-700">{transaction.bank_details?.bankName || "N/A"}</TableCell>
                  <TableCell className="py-4 font-mono text-gray-700">{transaction.bank_details?.accountNumber || "N/A"}</TableCell>
                  <TableCell className="py-4 text-gray-700">{transaction.bank_details?.name || "N/A"}</TableCell>
                  <TableCell className="py-4 font-semibold text-black whitespace-nowrap">
                    ₦{formatNumber(transaction.amount ?? 0)}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 whitespace-nowrap">
                    {formatDateNumerical(transaction.time_of_transaction ?? "")}
                  </TableCell>
                  <TableCell className="py-4">
                    <TransactionStatus status={transaction.admin_status || undefined} />
                  </TableCell>
                  <TableCell className="py-4">
                    <TransactionAction
                      status={transaction.admin_status ?? ""}
                      transactionId={transaction._id ?? ""}
                      tag="withdrawalTransactions"
                      declineReasons={DECLINE_REASONS}
                      onApprove={onApprove}
                      onDecline={onDecline}
                    />
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
