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
import { AgencyWalletTransactionRow } from "../hooks/use-agency-transactions";

interface AgencyWalletTransactionsTableProps {
  transactions: AgencyWalletTransactionRow[];
  emptyText: string;
}

const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? Number(value) : 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const statusTone: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  successful: "bg-emerald-100 text-emerald-800",
  success: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  declined: "bg-rose-100 text-rose-800",
  failed: "bg-rose-100 text-rose-800",
};

export function AgencyWalletTransactionsTable({
  transactions,
  emptyText,
}: AgencyWalletTransactionsTableProps) {
  return (
    <div className="rounded-md border border-gray-200 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Transaction Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const status = (transaction.status || "").toLowerCase();
              const reference =
                transaction.paystack_reference ||
                transaction.transfer_reference ||
                "-";

              return (
                <TableRow key={transaction._id}>
                  <TableCell className="font-mono text-xs">{transaction._id}</TableCell>
                  <TableCell>{formatDate(transaction.time_of_transaction)}</TableCell>
                  <TableCell className="capitalize">{transaction.type || "-"}</TableCell>
                  <TableCell className="capitalize">
                    {(transaction.transaction_type || "-").replaceAll("_", " ")}
                  </TableCell>
                  <TableCell className="font-medium">{formatAmount(transaction.amount)}</TableCell>
                  <TableCell className="max-w-[280px] truncate" title={transaction.description || "-"}>
                    {transaction.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusTone[status] || "bg-gray-100 text-gray-800"}>
                      {transaction.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{reference}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
