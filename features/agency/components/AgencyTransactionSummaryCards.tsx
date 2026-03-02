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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Total Transactions</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{totalTransactions}</CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{formatCurrency(totalAmount)}</CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Approved Amount</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{formatCurrency(approvedAmount)}</CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Approved Transactions</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{approvedTransactions.length}</CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Pending Transactions</CardTitle>
          <Clock3 className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{pendingTransactions.length}</CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Declined Transactions</CardTitle>
          <XCircle className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{declinedTransactions.length}</CardContent>
      </Card>
    </div>
  );
}
