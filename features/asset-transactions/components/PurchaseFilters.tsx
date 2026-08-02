"use client";

import { CalendarDays, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";

import { PURCHASE_STATUSES, PURCHASE_STATUS_LABELS } from "../schemas/purchase.schema";

const STATUS_OPTIONS = PURCHASE_STATUSES.map((status) => ({
  label: PURCHASE_STATUS_LABELS[status],
  value: status,
}));

/**
 * A filter the old screen had that GET /admin/transactions cannot serve yet.
 * Rendered disabled rather than dropped (or worse, live-but-ignored): a
 * control that silently returns the unfiltered list reads as "no results
 * match", which is a confident wrong answer. Goes live by swapping to
 * `FilterSelect` when the param lands.
 */
function InactiveFilter({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Pending backend support — the endpoint has no parameter for this yet"
      className="flex h-10 w-full min-w-0 cursor-not-allowed items-center justify-between gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground opacity-60 sm:h-9 sm:w-fit sm:min-w-40"
    >
      {label}
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
    </button>
  );
}

/**
 * The old screen's full filter row, preserved. Only status is live —
 * GET /admin/transactions takes type/status/user and nothing else. The rest
 * are visible but disabled until the backend grows the params
 * (docs/BACKEND-REQUESTS.md records each).
 */
export function PurchaseFilters() {
  return (
    <div className="space-y-3">
      <div className="relative min-w-0 max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          disabled
          className="pl-9"
          placeholder="Search unavailable — pending backend update"
          aria-label="Search asset transactions (unavailable)"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="All statuses" />
        <InactiveFilter label="All sales types" />
        <InactiveFilter label="All payment methods" />
        <InactiveFilter label="All asset types" />
        <button
          type="button"
          disabled
          title="Pending backend support — the endpoint has no date parameters yet"
          className="flex h-10 w-full min-w-0 cursor-not-allowed items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground opacity-60 sm:h-9 sm:w-fit"
        >
          <CalendarDays className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          Date range
        </button>
      </div>
    </div>
  );
}
