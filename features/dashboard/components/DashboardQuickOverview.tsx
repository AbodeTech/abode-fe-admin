"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CreditCardIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DashboardKpis } from "../schemas/dashboard-kpi.schema";

interface DashboardQuickOverviewProps {
  data: DashboardKpis;
}

type MetricCard = {
  id: string;
  title: string;
  value: ReactNode;
  description: ReactNode;
  icon: ReactNode;
  href?: string;
  delta?: number | null;
};

function Delta({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const up = value > 0;
  const flat = value === 0;
  return (
    <p
      className={`text-xs ${
        flat ? "text-muted-foreground" : up ? "text-green-600" : "text-destructive"
      }`}
    >
      {flat ? "No change" : `${up ? "+" : ""}${value}% vs prior period`}
    </p>
  );
}

function MetricCardView({ card }: { card: MetricCard }) {
  const content = (
    <Card
      className={`min-w-0 overflow-hidden ${
        card.href ? "h-full cursor-pointer transition-colors hover:bg-muted/50" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
        {card.icon}
      </CardHeader>
      <CardContent>
        <div className="wrap-break-word text-lg font-bold tabular-nums sm:text-xl md:text-2xl">
          {card.value}
        </div>
        <div className="text-xs text-muted-foreground">{card.description}</div>
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

export default function DashboardQuickOverview({ data }: DashboardQuickOverviewProps) {
  const [showAll, setShowAll] = useState(false);
  const delta = data.delta_pct ?? null;

  const primaryCards: MetricCard[] = [
    {
      id: "users",
      title: "Users",
      value: data.total_users || 0,
      description: "Total registered users",
      icon: <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
    },
    {
      id: "associates",
      title: "Associates",
      value: data.associate_users || 0,
      description: "Total associates",
      icon: <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
    },
    {
      id: "associates-pro",
      title: "Associates Pro",
      value: data.associate_pro_users || 0,
      description: "Total pro associates",
      icon: <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
    },
    {
      id: "revenue",
      title: "Revenue",
      value: formatCurrency(data.period_revenue || 0),
      description: "Money taken in the selected window",
      icon: <DollarSignIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
      delta: delta?.period_revenue,
    },
    {
      id: "inflow",
      title: "Inflow",
      value: formatCurrency(data.inflow || 0),
      description: "Total incoming funds",
      icon: <ArrowDownIcon className="h-4 w-4 shrink-0 text-green-500" />,
      delta: delta?.inflow,
    },
    {
      id: "outflow",
      title: "Outflow",
      value: formatCurrency(data.outflow || 0),
      description: "Total outgoing funds",
      icon: <ArrowUpIcon className="h-4 w-4 shrink-0 text-destructive" />,
      delta: delta?.outflow,
    },
  ];

  const secondaryCards: MetricCard[] = [
    {
      id: "products",
      title: "Products",
      value: data.total_assets || 0,
      description: "Total products available",
      icon: <PackageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
    },
    {
      id: "suspended-users",
      title: "Suspended Users",
      value: data.suspended_users || 0,
      description: "Click to view details",
      icon: <UsersIcon className="h-4 w-4 shrink-0 text-destructive" />,
      href: "/users/suspended",
    },
    {
      id: "terminated-plans",
      title: "Termination Payment Plans",
      value: data.suspended_payment_plans || 0,
      description: "Click to view details",
      icon: <UsersIcon className="h-4 w-4 shrink-0 text-destructive" />,
      href: "/users/suspended-payment-plans",
    },
    {
      id: "default-users",
      title: "Default Users",
      value: data.default_users || 0,
      description: "Click to view details",
      icon: <UsersIcon className="h-4 w-4 shrink-0 text-destructive" />,
      href: "/users/defaults",
    },
    {
      id: "payment-plans",
      title: "Payment plans",
      value: data.total_payment_plans || 0,
      description: (
        <>
          {data.closed_plans_count || 0} closed · {data.admin_created_plans_count || 0}{" "}
          admin-created
        </>
      ),
      icon: <CreditCardIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
    },
    {
      id: "new-plans",
      title: "New plans (period)",
      value: data.period_new_payment_plans || 0,
      description: <>{data.period_new_users || 0} new users in period</>,
      icon: <ShoppingCartIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
      delta: delta?.period_new_payment_plans,
    },
    {
      id: "wallet",
      title: "Wallet Balance",
      value: formatCurrency(data.wallet_balances_held_total || 0),
      description: "Total wallet balances held",
      icon: <WalletIcon className="h-4 w-4 shrink-0 text-muted-foreground" />,
    },
  ];

  const visibleCards = showAll ? [...primaryCards, ...secondaryCards] : primaryCards;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl">
          Dashboard Data Points
        </h2>
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-sm font-medium sm:justify-end"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Show less" : `Show more (${secondaryCards.length})`}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <MetricCardView key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
