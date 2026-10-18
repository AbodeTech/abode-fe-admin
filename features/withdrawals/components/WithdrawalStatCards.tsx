"use client";

import { AlertTriangle, CheckCircle, Clock, Wallet, XCircle, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { useWithdrawalStats } from "../hooks/use-withdrawal-stats";
import { useWalletStats } from "../hooks/use-wallet-stats";
import type { WithdrawalStatsFilters } from "../schemas/withdrawal.schema";

/* ============================================================
 * The withdrawal queue's summary cards, live on
 * GET /admin/withdrawals/stats.
 *
 * These figures are GLOBAL — the endpoint accepts a date range and nothing
 * else, so they describe the whole queue, not the filtered table below them.
 * That is deliberate on the BE's side; don't wire the table's filters in
 * expecting the numbers to follow.
 *
 * The wallet balance card is the one figure here that is NOT from this
 * endpoint — it comes from GET /admin/wallets/stats, a live sum over wallets
 * rather than a transaction rollup, so it does not move with the date range.
 * It is also the one card allowed to be absent: if that call fails the other
 * five still render.
 * ============================================================ */

interface Props {
  /** Optional date range. Omitted means all-time. */
  filters?: WithdrawalStatsFilters;
}

export function WithdrawalStatCards({ filters }: Props) {
  const { data, isLoading, isError } = useWithdrawalStats(filters);
  const { data: wallet } = useWalletStats();
  const walletBalance = wallet?.users_wallet_balance ?? null;

  // A failed aggregation hides the strip rather than pushing an error banner
  // above the queue: the table is the page's real content and still works.
  if (isError) return null;

  if (isLoading || !data) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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

  const cards = [
    {
      title: "Pending review",
      value: data.pending_review_count.toLocaleString(),
      sub: `${formatNaira(data.pending_review_amount)} awaiting`,
      icon: Clock,
    },
    { title: "Approved", value: data.approved_count.toLocaleString(), icon: CheckCircle },
    { title: "Rejected", value: data.rejected_count.toLocaleString(), icon: XCircle },
    { title: "Auto-approved", value: data.auto_approved_count.toLocaleString(), icon: Zap },
    { title: "Auto-failed", value: data.auto_failed_count.toLocaleString(), icon: AlertTriangle },
    {
      title: "Users' wallet balance",
      value: walletBalance == null ? "—" : formatNaira(walletBalance),
      icon: Wallet,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((stat) => (
        <Card key={stat.title} className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              {stat.sub ? (
                <p className="text-xs text-muted-foreground tabular-nums">{stat.sub}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
