"use client";

import { Loader2 } from "lucide-react";
import { useSalesStatusCounts } from "../hooks/use-sales";
import type { SalesFilters } from "../hooks/use-sales";
import { PAYMENT_STATUS_BADGE_CLASSES } from "../lib/payment-status";

const formatCount = (count: number) => new Intl.NumberFormat("en-NG").format(count);

export function SalesStatusChips({
  filters,
}: {
  filters: Pick<SalesFilters, "search" | "startDate" | "endDate" | "assetType">;
}) {
  const { data: counts, isLoading, isError } = useSalesStatusCounts(filters);

  if (isError) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-0 text-sm text-muted-foreground sm:px-2 md:px-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading payment breakdown…
      </div>
    );
  }

  if (!counts) return null;

  const chips = [
    { label: "Paid", value: counts.paid, className: PAYMENT_STATUS_BADGE_CLASSES.Paid },
    { label: "Still Paying", value: counts.stillPaying, className: PAYMENT_STATUS_BADGE_CLASSES["Still Paying"] },
    { label: "Unpaid", value: counts.unpaid, className: PAYMENT_STATUS_BADGE_CLASSES.Unpaid },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 px-0 sm:px-2 md:px-4">
      <span className="text-sm text-muted-foreground">
        {formatCount(counts.total)} payment plans:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${chip.className}`}
        >
          {chip.label} · {formatCount(chip.value)}
        </span>
      ))}
    </div>
  );
}
