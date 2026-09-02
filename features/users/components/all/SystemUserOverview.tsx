"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Briefcase,
  UserPlus,
  Activity,
  Box,
  Crown,
  UserX,
  Ban,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LifetimeKpi, PeriodScopedKpi } from "@/features/dashboard/schemas/dashboard-kpi.schema";

import { useSystemUsersOverview } from "../../hooks/use-users";

interface SystemUserOverviewProps {
  startDate?: string;
  endDate?: string;
}

type OverviewCard = {
  id: string;
  title: string;
  value: number;
  delta: number | null;
  icon: typeof Users;
  href?: string;
};

function Delta({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const up = value > 0;
  const flat = value === 0;
  return (
    <p
      className={`mt-1 text-xs ${
        flat ? "text-muted-foreground" : up ? "text-green-600" : "text-destructive"
      }`}
    >
      {flat ? "No change" : `${up ? "+" : ""}${value}% vs prior period`}
    </p>
  );
}

function MetricCardView({ card }: { card: OverviewCard }) {
  const content = (
    <Card
      className={`min-w-0 overflow-hidden border border-[#E5EAEF] shadow-sm ${
        card.href ? "h-full cursor-pointer transition-colors hover:bg-muted/50" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="min-w-0 pr-2 text-sm font-medium text-[#667085]">{card.title}</CardTitle>
        <card.icon className="h-4 w-4 shrink-0 text-[#98A2B3]" />
      </CardHeader>
      <CardContent>
        <div className="wrap-break-word text-xl font-bold tabular-nums text-[#101828] sm:text-2xl">
          {card.value?.toLocaleString() ?? 0}
        </div>
        <Delta value={card.delta} />
      </CardContent>
    </Card>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="block min-w-0">
        {content}
      </Link>
    );
  }

  return content;
}

export function SystemUserOverview({ startDate, endDate }: SystemUserOverviewProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: metrics, isLoading } = useSystemUsersOverview({ startDate, endDate });

  if (isLoading) {
    return (
      <div className="min-w-0 space-y-4">
        <h2 className="text-lg font-semibold text-[#101828] sm:text-xl">System Overview</h2>
        <div className="grid min-w-0 grid-cols-1 gap-4 min-[380px]:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const period = (
    id: string,
    title: string,
    kpi: PeriodScopedKpi,
    icon: typeof Users
  ): OverviewCard => ({
    id,
    title,
    value: kpi.value,
    delta: kpi.delta_pct,
    icon,
  });

  const life = (
    id: string,
    title: string,
    kpi: LifetimeKpi,
    icon: typeof Users,
    href?: string
  ): OverviewCard => ({
    id,
    title,
    value: kpi.value,
    delta: null,
    icon,
    href,
  });

  const overdue = metrics.users_with_overdue_plans ?? metrics.overdueUsers;

  const primaryCards: OverviewCard[] = [
    period("new-users", "New Users", metrics.new_users, Users),
    period("new-associates", "New Associates", metrics.new_associates, UserPlus),
    period("new-associate-pros", "New Associate Pros", metrics.new_associate_pros, Briefcase),
    life("all-users", "All Users", metrics.total_users, Users),
    life("associates", "Associates", metrics.total_associates, UserPlus),
    life("associates-pro", "Associates Pro", metrics.total_associate_pros, Briefcase),
  ];

  const secondaryCards: OverviewCard[] = [
    life("active-associates", "Active Associates", metrics.active_associates, Activity),
    life("active-associates-pro", "Active Associates Pro", metrics.active_associate_pros, Activity),
    life("with-assets", "With Assets", metrics.users_with_assets, Box),
    life("default-users", "Default Users", metrics.default_users, UserCheck, "/admin/payment-plans?has_defaults=true"),
    life("overdue-plans", "Overdue Plans", overdue, UserX),
    life("suspended", "Suspended", metrics.suspended_users, Ban, "/users/suspended"),
    life("founders", "Founders", metrics.founders, Crown),
    life("premium", "Premium", metrics.premium_users, Sparkles),
  ];

  const visibleCards = showAll ? [...primaryCards, ...secondaryCards] : primaryCards;

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-[#101828] sm:text-xl">System Overview</h2>
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-sm font-medium sm:justify-end"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Show less" : `Show more (${secondaryCards.length})`}
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <MetricCardView key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
