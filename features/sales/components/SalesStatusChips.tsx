"use client";

import { Loader2 } from "lucide-react";
import { useSalesPlanStatusCounts } from "../hooks/use-sales";
import type { SalesListFilters } from "../hooks/use-sales";
import { SALES_PLAN_STATUSES } from "../schemas/sales.schema";
import { PLAN_STATUS_BADGE_CLASSES, PLAN_STATUS_LABELS } from "../lib/plan-status";

const formatCount = (count: number) => new Intl.NumberFormat("en-NG").format(count);

export function SalesStatusChips({
  filters,
}: {
  filters: Pick<SalesListFilters, "q" | "createdStartDate" | "createdEndDate" | "assetType" | "sourceType">;
}) {
  const { data, isLoading, error } = useSalesPlanStatusCounts(filters);

  if (error) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-0 text-sm text-muted-foreground sm:px-2 md:px-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading status breakdown…
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-0 sm:px-2 md:px-4">
      <span className="text-sm text-muted-foreground">{formatCount(data.total)} payment plans:</span>
      {SALES_PLAN_STATUSES.map((status) => (
        <span
          key={status}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${PLAN_STATUS_BADGE_CLASSES[status]}`}
        >
          {PLAN_STATUS_LABELS[status]} · {formatCount(data.counts[status])}
        </span>
      ))}
    </div>
  );
}
