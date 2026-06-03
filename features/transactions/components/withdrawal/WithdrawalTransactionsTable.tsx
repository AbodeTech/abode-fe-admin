"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { User, Hash, CreditCard, DollarSign, Calendar, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { TransactionAction } from "@/components/shared/TransactionAction";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth-store";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { WithdrawalTransactionsTable_DataFragment } from "@/lib/gql/graphql";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export const WithdrawalTransactionsFragment = graphql(`
  fragment WithdrawalTransactionsTable_data on AdminTransactions {
    _id
    admin_status
    amount
    time_of_transaction
    processing_type
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
      tin
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
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
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
  const { user } = useAuthStore();
  const canManageWithdrawal = (user?.permissions ?? []).includes("withdrawals") || user?.role === "admin";
  const transactionsRaw = data || [];
  const transactions = transactionsRaw.map((t) => getFragmentData(WithdrawalTransactionsFragment, t));

  const validTransactions = transactions
    .filter((t): t is WithdrawalTransactionsTable_DataFragment => t !== null && t !== undefined)
    .filter((tx) => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const first = tx.user?.firstName?.toLowerCase() ?? "";
      const last = tx.user?.lastName?.toLowerCase() ?? "";
      const fullName = `${first} ${last}`.trim();
      const accountName = tx.bank_details?.name?.toLowerCase() ?? "";
      return (
        first.includes(q) ||
        last.includes(q) ||
        fullName.includes(q) ||
        accountName.includes(q)
      );
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
            <AdminMobileField label="TIN" value={transaction.tin || "N/A"} />
            <AdminMobileField label="Bank" value={transaction.bank_details?.bankName || "N/A"} />
            <AdminMobileField label="Account" value={transaction.bank_details?.accountNumber || "N/A"} />
            <AdminMobileField label="Account name" value={transaction.bank_details?.name || "N/A"} />
            <AdminMobileField label="Amount" value={`₦${formatNumber(transaction.amount ?? 0)}`} />
            <AdminMobileField label="Date" value={formatDateNumerical(transaction.time_of_transaction ?? "")} />
            <AdminMobileField label="Method" value={<ProcessingMethodBadge type={transaction.processing_type ?? undefined} />} />
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <TransactionStatus status={transaction.admin_status || undefined} />
            </div>
            {canManageWithdrawal && (
              <div className="pt-2">
                <TransactionAction
                  status={transaction.admin_status ?? ""}
                  transactionId={transaction._id ?? ""}
                  tag="withdrawalTransactions"
                  declineReasons={DECLINE_REASONS}
                  onApprove={onApprove}
                  onDecline={onDecline}
                />
              </div>
            )}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
      <Card className="border border-gray-200 pt-0">
        <div className="min-w-0 w-full overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow className="text-sm font-bold text-black">
                <TableHead className="py-0 font-semibold">
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
                    <Zap className="h-4 w-4" />
                    Method
                  </div>
                </TableHead>
                <TableHead className="py-4 font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Status
                  </div>
                </TableHead>
                {canManageWithdrawal && <TableHead className="py-4 font-semibold">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {validTransactions.map((transaction, idx) => (
                <TableRow
                  key={transaction._id}
                  className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 ${idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                    }`}
                >
                  <TableCell className="py-4 w-37.5">
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
                    <ProcessingMethodBadge type={transaction.processing_type ?? undefined} />
                  </TableCell>
                  <TableCell className="py-4">
                    <TransactionStatus status={transaction.admin_status || undefined} />
                  </TableCell>
                  {canManageWithdrawal && (
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
                  )}
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

function ProcessingMethodBadge({ type }: { type?: string }) {
  if (type === "auto") {
    return (
      <div className="py-0.5 px-2 border border-[#C7D7FE] rounded-2xl bg-[#EEF4FF] flex items-center w-fit gap-x-1">
        <Zap className="w-2.5 h-2.5 text-[#3538CD]" />
        <p className="text-xs font-medium text-[#3538CD]">Auto</p>
      </div>
    );
  }

  return (
    <div className="py-0.5 px-2 border border-[#E4E7EC] rounded-2xl bg-[#F9FAFB] flex items-center w-fit gap-x-1">
      <User className="w-2.5 h-2.5 text-[#667085]" />
      <p className="text-xs font-medium text-[#667085]">Manual</p>
    </div>
  );
}
