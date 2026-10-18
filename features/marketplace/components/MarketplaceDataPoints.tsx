"use client";

import {
  CheckCircle,
  CircleDollarSign,
  ClipboardList,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketplaceStats } from "../schemas/marketplace.schema";
import { totalListingsFromStats } from "../schemas/marketplace.schema";

interface MarketplaceDataPointsProps {
  data: MarketplaceStats | undefined;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export function MarketplaceDataPoints({ data, isLoading }: MarketplaceDataPointsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="min-w-0 overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const byStatus = data?.by_status ?? {};

  return (
    <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tabular-nums sm:text-2xl">
            {data ? totalListingsFromStats(data) : 0}
          </div>
          <p className="text-xs text-muted-foreground">All marketplace listings, any status</p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
          <CircleDollarSign className="h-4 w-4 shrink-0 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tabular-nums sm:text-2xl">{byStatus.active || 0}</div>
          <p className="text-xs text-muted-foreground">Currently available for purchase</p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sold</CardTitle>
          <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tabular-nums sm:text-2xl">{byStatus.sold || 0}</div>
          <p className="text-xs text-muted-foreground">Completed sales</p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <ClipboardList className="h-4 w-4 shrink-0 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tabular-nums sm:text-2xl">
            {byStatus.pending_approval || 0}
          </div>
          <p className="text-xs text-muted-foreground">Receipt purchases awaiting review</p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
          <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
            {formatCurrency(data?.total_sales_value || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {data?.total_sales || 0} completed sale{data?.total_sales === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platform Fees Earned</CardTitle>
          <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
            {formatCurrency(data?.total_platform_fees || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Platform fee from completed sales</p>
        </CardContent>
      </Card>
    </div>
  );
}
