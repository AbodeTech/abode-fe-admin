"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserCheck, Building, CreditCard, DollarSign, Calendar, CheckCircle, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import { AssetTransactionAction } from "./AssetTransactionAction";
import { ViewTransactionEvidence } from "./ViewTransactionEvidence";
import { format } from "date-fns";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { AssetTransactionsTable_DataFragment } from "@/lib/gql/graphql";

export const AssetTransactionsFragment = graphql(`
  fragment AssetTransactionsTable_data on AdminTransactions {
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

// Format number with commas
const formatNumber = (amount: number | string) => {
  const num = Number(amount);
  return isNaN(num) ? "0" : num.toLocaleString();
};

// Format date as dd/MM/yyyy
const formatDateNumerical = (dateString: string) => {
  try {
    return format(new Date(dateString), "yyyy/MM/dd");
  } catch {
    return dateString;
  }
};

// Shorten description
const updatedString = (str: string) =>
  str.includes("asset purchase") ? str.replace("asset purchase", "AP") : str;

interface AssetTransactionsTableProps {
  data: (FragmentType<typeof AssetTransactionsFragment> | null)[] | null | undefined;
  isLoading?: boolean;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
}

export function AssetTransactionsTable({ data, isLoading, onApprove, onDecline }: AssetTransactionsTableProps) {
  const nonNullData = (data || []).filter((t): t is FragmentType<typeof AssetTransactionsFragment> => t !== null);
  const validTransactions = getFragmentData(AssetTransactionsFragment, nonNullData);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
  }

  if (!data || validTransactions.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No asset transactions found</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no asset transactions to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4 p-4">
        {validTransactions.map((transaction, idx) => (
          <MobileTransactionCard key={transaction._id} data={transaction}  onApprove={onApprove} onDecline={onDecline} />
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <Card className="border border-gray-200 pt-0!
        ">
          <div className="w-full overflow-x-auto">
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
                    <TableCell className="py-4 w-30">
                      <Link
                        href={`/users/${transaction.user?._id}`}
                        className="text-black hover:text-gray-700 font-medium hover:underline transition-colors truncate block"
                      >
                        {transaction.user?.lastName} {transaction.user?.firstName}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 text-gray-700 w-25 truncate">
                      {transaction.referral ?? "No Referrer"}
                    </TableCell>
                    <TableCell className="py-4 text-gray-700 w-[200px] max-w-[200px] break-words whitespace-normal overflow-hidden">
                      {transaction.asset_type || ""} - {updatedString(`${transaction.description ?? ""}(${transaction.plot_size ?? ""}sqm)`)}
                    </TableCell>
                    <TableCell className="py-4 text-gray-700 min-w-30 whitespace-nowrap text-center z-15">{transaction.transaction_type ?? ""}</TableCell>
                    <TableCell className="py-4 font-semibold text-black w-25 whitespace-nowrap">
                      ₦{formatNumber(transaction.amount ?? 0)}
                    </TableCell>
                    <TableCell className="py-4 text-gray-700 w-25 whitespace-nowrap">
                      {formatDateNumerical(transaction.time_of_transaction ?? "")}
                    </TableCell>
                    <TableCell className="py-4">
                      <TransactionStatus status={transaction.admin_status || undefined} />
                    </TableCell>
                    <TableCell className="py-4">
                      <AssetTransactionAction
                        status={transaction.admin_status ?? ""}
                        assetId={transaction._id ?? ""}
                        onApprove={onApprove}
                        onDecline={onDecline}
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
          </div>
        </Card>
      </div>
    </div>
  );
}

// Mobile Card Component
function MobileTransactionCard({
  data,
  onApprove,
  onDecline
}: {
  data: AssetTransactionsTable_DataFragment;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
}) {
  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            <Link href={`/users/${data.user?._id}`} className="hover:underline">
              {data.user?.lastName} {data.user?.firstName}
            </Link>
          </CardTitle>
          <TransactionStatus status={data.admin_status} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Amount */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Amount</span>
          </div>
          <span className="text-xl font-bold text-black">₦{formatNumber(data.amount ?? 0)}</span>
        </div>

        {/* Property Details */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Building className="h-4 w-4 text-gray-600 mt-1 shrink-0" />
            <div className="flex-1">
              <span className="text-sm text-gray-600">Property</span>
              <p className="text-sm font-medium text-gray-900 wrap-break-word">
                {data.asset_type || ""} - {updatedString(`${data.description ?? ""}(${data.plot_size ?? ""}sqm)`)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Type
            </span>
            <span className="text-sm font-medium text-gray-900">{data.transaction_type ?? ""}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Referrer
            </span>
            <span className="text-sm font-medium text-gray-900">{data.referral || "No Referrer"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatDateNumerical(data.time_of_transaction ?? "")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          {data.transfer_file && (
            <ViewTransactionEvidence
              image={data.transfer_file.file ?? undefined}
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                  <Eye className="h-4 w-4" />
                  View Evidence
                </button>
              }
            />
          )}
          <AssetTransactionAction
            status={data.admin_status ?? ""}
            assetId={data._id ?? ""}
            onApprove={onApprove}
            onDecline={onDecline}
          />
        </div>
      </CardContent>
    </Card>
  );
}
