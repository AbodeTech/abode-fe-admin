"use client";

import { CheckCircle, Clock, Repeat, ShoppingCart, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira, formatNairaCompact } from "@/lib/utils/format";

import { usePurchaseStats } from "../hooks/use-purchase-stats";
import type { PurchaseListFilters } from "../hooks/query-keys";
import { offerTypeLabel } from "../schemas/purchase.schema";

/* ============================================================
 * Asset transaction summary cards, live on
 * GET /admin/transactions/stats.
 *
 * FILTER-AWARE: pass the page's filters and the numbers describe exactly the
 * rows in the table below. That is the whole point of this endpoint — the
 * withdrawal and document cards are global and deliberately do not do this.
 *
 * The per-offer-type cards come from the response rather than a local list, so
 * an offer type the BE knows about (commercial, say) still gets a card even
 * though this feature's `ASSET_TYPES` filter can't select it.
 * ============================================================ */

interface Props {
  filters?: Omit<PurchaseListFilters, "page" | "limit">;
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {sub ? <p className="text-xs text-muted-foreground tabular-nums">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

export function PurchaseStatCards({ filters }: Props) {
  const { data, isLoading, isError } = usePurchaseStats(filters);

  // Hide the strip on a failed aggregation; the table still works.
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
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Approved value"
        value={formatNaira(data.approved_amount)}
        sub={plural(data.approved_count, "transaction", "transactions")}
        icon={CheckCircle}
      />
      <StatCard
        title="Pending value"
        value={formatNaira(data.pending_amount)}
        sub={`${data.pending_count.toLocaleString()} awaiting review`}
        icon={Clock}
      />
      {/* "failed" folds in here on the BE, so the label says so rather than
          quietly counting failures as declines. */}
      <StatCard
        title="Declined / failed value"
        value={formatNaira(data.declined_amount)}
        sub={plural(data.declined_count, "transaction", "transactions")}
        icon={XCircle}
      />
      <StatCard
        title="New sales"
        value={formatNaira(data.new_sales_amount)}
        sub={plural(data.new_sales_count, "purchase", "purchases")}
        icon={ShoppingCart}
      />
      <StatCard
        title="Recurring payments"
        value={formatNaira(data.recurring_payments_amount)}
        sub={plural(data.recurring_payments_count, "installment", "installments")}
        icon={Repeat}
      />
      {/* Per offer type, split by sales cycle. The headline is the offer's
          total; the sub carries the cross-split, which is the number the
          marginal cards above cannot answer. */}
      {data.by_offer_type.map((row) => (
        <StatCard
          key={row.offer_type}
          title={`${offerTypeLabel(row.offer_type)} sales`}
          value={formatNaira(row.amount)}
          sub={`${formatNairaCompact(row.new_amount)} new · ${formatNairaCompact(
            row.recurring_amount
          )} recurring`}
          icon={ShoppingCart}
        />
      ))}
    </div>
  );
}
