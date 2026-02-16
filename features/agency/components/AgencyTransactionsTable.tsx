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
    <div className="border border-gray-200 rounded-md overflow-x-auto">
      <Table>
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
                  <TableCell className="font-mono text-xs max-w-[180px] truncate" title={transactionId}>
                    {transactionId}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {[transaction.referral_user?.firstName, transaction.referral_user?.lastName]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">{transaction.referral_user?.email || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{transaction.asset?.asset_name || "-"}</div>
                    <div className="text-xs text-muted-foreground">{transaction.asset?.asset_type || "-"}</div>
                  </TableCell>
                  <TableCell className="capitalize">{transaction.transaction_type?.replaceAll("_", " ") || "-"}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>{formatCurrency(transaction.commission_earned)}</TableCell>
                  <TableCell>
                    <Badge className={statusTone[status] || "bg-gray-100 text-gray-800"}>
                      {transaction.transaction_id?.admin_status || transaction.transaction_id?.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
  );
}
