"use client";

import { DashboardCard } from "@/components/shared/DashboardCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Building2,
  CircleDollarSign,
  Layers,
  ScrollText,
  Wallet,
} from "lucide-react";
import {
  formatTerminationPaymentPlansMetricValue,
  type TerminationPaymentPlansMetrics,
} from "../../utils/compute-termination-payment-plans-metrics";

function MetricSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-8 max-w-full min-w-0 animate-pulse rounded bg-gray-200" />
      </CardContent>
    </Card>
  );
}

interface TerminationPaymentPlansSummaryProps {
  metrics: TerminationPaymentPlansMetrics;
  isLoading?: boolean;
}

export function TerminationPaymentPlansSummary({ metrics, isLoading }: TerminationPaymentPlansSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-4 min-[380px]:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
    );
  }

  const cards: {
    title: string;
    key: keyof TerminationPaymentPlansMetrics;
    icon: typeof ScrollText;
  }[] = [
    { title: "Total Plans", key: "totalPlans", icon: ScrollText },
    { title: "Total Units", key: "totalUnits", icon: Layers },
    { title: "Total Amount Paid", key: "totalAmountPaid", icon: CircleDollarSign },
    { title: "Total Outstanding", key: "totalOutstanding", icon: Wallet },
    { title: "Flex Plans", key: "flexPlans", icon: Building2 },
    { title: "Full Ownership Plans", key: "fullOwnershipPlans", icon: Building2 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 min-[380px]:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ title, key, icon }) => (
        <DashboardCard
          key={key}
          title={title}
          value={formatTerminationPaymentPlansMetricValue(key, metrics)}
          icon={icon}
        />
      ))}
    </div>
  );
}
