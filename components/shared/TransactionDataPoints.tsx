"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, XCircle, DollarSign, Wallet, Zap, AlertTriangle } from "lucide-react";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getTransactionDataPoints } from "@/lib/api/admin/transactions.client";

interface TransactionDataPointsProps {
  type: "credit" | "debit" | "asset" | "commission" | "document";
}

function DataPointSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 max-w-full min-w-0 rounded bg-gray-200 animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function TransactionDataPoints({ type }: TransactionDataPointsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["transactionDataPoints", type],
    queryFn: () => getTransactionDataPoints(type),
  });

  if (isLoading) {
    return (
      <div className="mb-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(4)].map((_, index) => (
          <DataPointSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const stats = [
    {
      title: "Pending Transactions",
      value: data.pending_transaction?.toLocaleString() || "0",
      icon: Clock,
    },
    {
      title: "Approved Transactions",
      value: data.approved_transaction?.toLocaleString() || "0",
      icon: CheckCircle,
    },
    {
      title: "Rejected Transactions",
      value: data.rejected_transaction?.toLocaleString() || "0",
      icon: XCircle,
    },
    {
      title: "Users Wallet Balance",
      value: `₦${data.users_wallet_balance?.toLocaleString() || "0"}`,
      icon: Wallet,
    },
  ];

  // Add commission if available
  if (data.commission_transaction !== undefined) {
    stats.push({
      title: "Commission Transactions",
      value: `₦${data.commission_transaction?.toLocaleString() || "0"}`,
      icon: DollarSign,
    });
  }

  if (data.auto_approved_transaction !== undefined) {
    stats.push({
      title: "Auto-Approved",
      value: data.auto_approved_transaction?.toLocaleString() || "0",
      icon: Zap,
    });
  }

  if (data.auto_failed_transaction !== undefined) {
    stats.push({
      title: "Auto-Failed",
      value: data.auto_failed_transaction?.toLocaleString() || "0",
      icon: AlertTriangle,
    });
  }

  return (
    <div className="mb-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <DashboardCard key={index} title={stat.title} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  );
}
