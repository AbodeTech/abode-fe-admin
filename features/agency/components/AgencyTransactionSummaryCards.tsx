"use client";

import { CheckCircle2, Clock3, DollarSign, ReceiptText, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgencyWalletTransactionRow } from "../hooks/use-agency-transactions";

interface AgencyTransactionSummaryCardsProps {
  transactions: AgencyWalletTransactionRow[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);

const toAmount = (value?: number | null) => (Number.isFinite(value) ? Number(value) : 0);

export function AgencyTransactionSummaryCards({ transactions }: AgencyTransactionSummaryCardsProps) {
  const totalTransactions = transactions.length;
  const approvedTransactions = transactions.filter((item) =>
    ["approved", "successful", "success"].includes((item.status || "").toLowerCase())
  );
  const pendingTransactions = transactions.filter(
    (item) => (item.status || "").toLowerCase() === "pending"
  );
  const declinedTransactions = transactions.filter((item) =>
    ["rejected", "declined", "failed"].includes((item.status || "").toLowerCase())
  );
  const totalAmount = transactions.reduce((sum, item) => sum + toAmount(item.amount), 0);
  const approvedAmount = approvedTransactions.reduce(
    (sum, item) => sum + toAmount(item.amount),
    0
  );

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card className="min-w-0 overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          <ReceiptText className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">{totalTransactions}</CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-lg font-semibold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
          {formatCurrency(totalAmount)}
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">Approved Amount</CardTitle>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        </CardHeader>
        <CardContent className="text-lg font-semibold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
          {formatCurrency(approvedAmount)}
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">Approved Transactions</CardTitle>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        </CardHeader>
        <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">{approvedTransactions.length}</CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">Pending Transactions</CardTitle>
          <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />
        </CardHeader>
        <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">{pendingTransactions.length}</CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">Declined Transactions</CardTitle>
          <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
        </CardHeader>
        <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">{declinedTransactions.length}</CardContent>
      </Card>
    </div>
  );
}
