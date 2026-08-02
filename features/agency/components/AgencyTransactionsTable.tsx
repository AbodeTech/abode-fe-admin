"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export interface AgencyTransactionRow {
  amount: number;
  commission_earned: number;
  transaction_type: string;
  transaction_date: string;
  asset?: {
    asset_name?: string | null;
    asset_type?: string | null;
  } | null;
  referral_user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  transaction_id?: {
    _id?: string | null;
    status?: string | null;
    admin_status?: string | null;
  } | null;
}

interface AgencyTransactionsTableProps {
  transactions?: AgencyTransactionRow[] | null;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const statusTone: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  declined: "bg-rose-100 text-rose-800",
  successful: "bg-emerald-100 text-emerald-800",
};

export function AgencyTransactionsTable({ transactions }: AgencyTransactionsTableProps) {
  const rows = transactions ?? [];

  return (
    <div className="w-full min-w-0 space-y-3">
      <AdminMobileStack>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No agency transactions available.</p>
        ) : (
          rows.map((transaction, index) => {
            const status = (transaction.transaction_id?.admin_status || transaction.transaction_id?.status || "").toLowerCase();
            const transactionId = transaction.transaction_id?._id || "-";
            return (
              <AdminMobileCard key={`${transactionId}-${index}`} title={String(transactionId)} subtitle={transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : "-"}>
                <AdminMobileField
                  label="Client"
                  value={
                    <span>
                      {[transaction.referral_user?.lastName, transaction.referral_user?.firstName].filter(Boolean).join(" ") || "-"}
                      <span className="mt-1 block text-xs text-muted-foreground">{transaction.referral_user?.email || "-"}</span>
                    </span>
                  }
                />
                <AdminMobileField
                  label="Asset"
                  value={
                    <span>
                      {transaction.asset?.asset_name || "-"}
                      <span className="mt-1 block text-xs text-muted-foreground">{transaction.asset?.asset_type || "-"}</span>
                    </span>
                  }
                />
                <AdminMobileField label="Type" value={transaction.transaction_type?.replaceAll("_", " ") || "-"} />
                <AdminMobileField label="Amount" value={formatCurrency(transaction.amount)} />
                <AdminMobileField label="Commission" value={formatCurrency(transaction.commission_earned)} />
                <AdminMobileField
                  label="Status"
                  value={
                    <Badge className={statusTone[status] || "bg-gray-100 text-gray-800"}>
                      {transaction.transaction_id?.admin_status || transaction.transaction_id?.status || "N/A"}
                    </Badge>
                  }
                />
              </AdminMobileCard>
            );
          })
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
    <div className="min-w-0 overflow-x-auto rounded-md border border-gray-200">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                No agency transactions available.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((transaction, index) => {
              const status = (transaction.transaction_id?.admin_status || transaction.transaction_id?.status || "").toLowerCase();
              const transactionId = transaction.transaction_id?._id || "-";
              return (
                <TableRow key={`${transactionId}-${index}`} className="hover:bg-muted/30">
                  <TableCell className="max-w-40 truncate font-mono text-xs" title={transactionId}>
                    {transactionId}
                  </TableCell>
                  <TableCell className="max-w-44">
                    <div className="font-medium wrap-break-word">
                      {[transaction.referral_user?.lastName, transaction.referral_user?.firstName]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </div>
                    <div className="wrap-break-word text-xs text-muted-foreground">
                      {transaction.referral_user?.email || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-40">
                    <div className="font-medium wrap-break-word">{transaction.asset?.asset_name || "-"}</div>
                    <div className="wrap-break-word text-xs text-muted-foreground">
                      {transaction.asset?.asset_type || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-36 capitalize wrap-break-word">
                    {transaction.transaction_type?.replaceAll("_", " ") || "-"}
                  </TableCell>
                  <TableCell className="tabular-nums wrap-break-word">{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell className="tabular-nums wrap-break-word">
                    {formatCurrency(transaction.commission_earned)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusTone[status] || "bg-gray-100 text-gray-800"}>
                      {transaction.transaction_id?.admin_status || transaction.transaction_id?.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {transaction.transaction_date
                      ? new Date(transaction.transaction_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
      </AdminDesktopTableWrap>
    </div>
  );
}
