"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Briefcase, DollarSign, Users } from "lucide-react";

interface AgencySystemMetricsProps {
  data?: {
    total_agencies?: number;
    active_agencies?: number;
    total_users_under_agencies?: number;
    all_agencies_total_sales_volume?: number;
    total_commission_paid?: number;
  } | null;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const metricItems: {
  key: keyof NonNullable<AgencySystemMetricsProps["data"]>;
  label: string;
  icon: React.ElementType;
  currency?: boolean;
}[] = [
    { key: "total_agencies", label: "Total Agencies", icon: Briefcase },
    { key: "active_agencies", label: "Active Agencies", icon: Activity },
    { key: "all_agencies_total_sales_volume", label: "Total Sales Volume", icon: DollarSign, currency: true },
    { key: "total_commission_paid", label: "Total Commission Paid", icon: DollarSign, currency: true },
    { key: "total_users_under_agencies", label: "Users under Agency", icon: Users },
  ];

export function AgencySystemMetrics({ data }: AgencySystemMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metricItems.map((item) => {
        const raw = data?.[item.key] ?? 0;
        const display = item.currency ? formatCurrency(raw as number) : raw;
        const Icon = item.icon;

        return (
          <Card key={item.key} className="border border-gray-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-xl font-semibold">{display}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
