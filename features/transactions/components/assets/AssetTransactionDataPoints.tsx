"use client";

import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  ShoppingBag,
  Zap,
  Repeat,
  Home,
  XCircle,
  LucideIcon,
} from "lucide-react";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAssetTransactionStats } from "../../hooks/use-transactions";

const iconMap: Record<string, LucideIcon> = {
  totalTransactions: ShoppingCart,
  approvedTransactions: CheckCircle,
  totalApprovedAmount: CheckCircle,
  pendingTransactions: Clock,
  totalPendingAmount: Clock,
  declinedTransactions: XCircle,
  totalDeclinedAmount: XCircle,
  new_sales: ShoppingBag,
  total_new_sales: ShoppingBag,
  flexTransactions: Zap,
  totalFlexAmount: Zap,
  new_flex_sales: Zap,
  flex_recurring_sales: Repeat,
  total_flex_recurring_sales: Repeat,
  fullOwnershipTransactions: Home,
  totalFullOwnershipAmount: Home,
  new_fullOwnership_sales: Home,
  total_new_fullOwnership_sales: Home,
  fullOwnership_recurring_sales: Repeat,
  total_fullOwnership_recurring_sales: Repeat,
};

const nairaKeys = new Set([
  "totalApprovedAmount",
  "totalPendingAmount",
  "totalDeclinedAmount",
  "total_new_sales",
  "totalFlexAmount",
  "totalFullOwnershipAmount",
  "total_flex_recurring_sales",
  "total_new_fullOwnership_sales",
  "total_fullOwnership_recurring_sales",
]);

function DashboardCardSkeleton() {
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

export function AssetTransactionDataPoints() {
  const searchParams = useSearchParams();

  const salesType = searchParams.get("salestype");
  const status = searchParams.get("transactionstatus");
  const transactionType = searchParams.get("transactiontype");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data, isLoading, error } = useAssetTransactionStats({
    salesType: salesType === "all" ? null : salesType,
    status: status === "all" ? null : status,
    transactionType: transactionType === "all" ? null : transactionType,
    startDate,
    endDate,
  });

  const dashboardStats = (data || {}) as Record<string, number>;

  const dashboardData = Object.keys(dashboardStats).map((key) => ({
    title: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim(),
    value: nairaKeys.has(key)
      ? `₦${Number(dashboardStats[key]).toLocaleString()}`
      : Number(dashboardStats[key]).toLocaleString(),
    icon: iconMap[key] || ShoppingCart,
  }));

  if (isLoading) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, index) => (
          <DashboardCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading statistics</div>;
  }

  if (dashboardData.length === 0) {
    return null;
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dashboardData.map((item, index) => (
        <DashboardCard key={index} title={item.title} value={item.value} icon={item.icon} />
      ))}
    </div>
  );
}
