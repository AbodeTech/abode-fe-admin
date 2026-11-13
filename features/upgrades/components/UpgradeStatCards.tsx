"use client";

import {
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Tag,
  UserCog,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import type { UpgradeListFilters } from "../hooks/query-keys";
import { useUpgradeStats } from "../hooks/use-upgrade-stats";
import {
  UPGRADE_PAYMENT_METHOD_LABELS,
  type UpgradePaymentMethod,
  type UpgradeStats,
} from "../schemas/upgrade.schema";

/* ============================================================
 * The upgrade queue's summary cards, live on
 * GET /admin/referrals/upgrades/stats.
 *
 * They follow every filter on the page, including the date range. Each upgrade
 * is counted on the day it reached its status — approved and declined on the
 * review date, pending on the request date — so picking October answers "what
 * did we approve in October", not "what was requested in October".
 * ============================================================ */

type StatCard = { title: string; value: string; sub?: string; icon: LucideIcon };

const CHANNEL_ICONS: Record<UpgradePaymentMethod, LucideIcon> = {
  transfer: Building2,
  paystack: CreditCard,
  "admin-manual": UserCog,
};

function rangeCaption(range: UpgradeStats["range"]): string {
  const { start_date, end_date } = range;
  if (!start_date && !end_date) return "All time";
  const day = (d: string) => format(new Date(`${d}T00:00:00`), "d MMM yyyy");
  if (start_date && end_date) {
    return start_date === end_date ? day(start_date) : `${day(start_date)} – ${day(end_date)}`;
  }
  return start_date ? `From ${day(start_date)}` : `Up to ${day(end_date!)}`;
}

function CardGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.title} className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            {stat.sub ? (
              <p className="text-xs text-muted-foreground tabular-nums">{stat.sub}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface Props {
  filters?: UpgradeListFilters;
}

export function UpgradeStatCards({ filters }: Props) {
  const { data, isLoading, isError } = useUpgradeStats(filters);

  if (isError) return null;

  if (isLoading || !data) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { by_status: s, by_payment_method: m, approved_discounts: d } = data;

  const statusCards: StatCard[] = [
    {
      title: "Waiting for review",
      value: s.pending.count.toLocaleString(),
      sub: `${formatNaira(s.pending.amount)} awaiting`,
      icon: Clock,
    },
    {
      title: "Approved",
      value: s.approved.count.toLocaleString(),
      sub: `${formatNaira(s.approved.amount)} collected`,
      icon: CheckCircle,
    },
    { title: "Declined", value: s.declined.count.toLocaleString(), icon: XCircle },
    {
      title: "Cancelled",
      value: s.cancelled.count.toLocaleString(),
      sub: "Expired without a decision, or withdrawn",
      icon: XCircle,
    },
  ];

  const channelCards: StatCard[] = (Object.keys(m) as UpgradePaymentMethod[]).map((method) => {
    const c = m[method];
    const parts = [
      c.approved.amount > 0 ? `${formatNaira(c.approved.amount)} collected` : null,
      c.pending.count ? `${c.pending.count.toLocaleString()} pending` : null,
      c.declined.count ? `${c.declined.count.toLocaleString()} declined` : null,
    ].filter(Boolean);
    return {
      title: UPGRADE_PAYMENT_METHOD_LABELS[method],
      value: `${c.approved.count.toLocaleString()} approved`,
      sub: parts.length ? parts.join(" · ") : undefined,
      icon: CHANNEL_ICONS[method],
    };
  });

  channelCards.push({
    title: "Coupons used",
    value: d.count.toLocaleString(),
    sub: `${formatNaira(d.amount)} discounted on approved upgrades`,
    icon: Tag,
  });

  return (
    <section className="space-y-3" aria-label="Upgrade stats">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{rangeCaption(data.range)}</span>
        {" · "}
        {data.total.toLocaleString()} upgrades. Approved and declined are counted on the review
        date, pending on the request date.
      </p>
      <CardGrid cards={statusCards} />
      <p className="pt-1 text-sm font-medium">By payment channel</p>
      <CardGrid cards={channelCards} />
    </section>
  );
}
