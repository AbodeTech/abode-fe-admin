"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { CsPlanFilter } from "@/lib/gql/graphql";
import type { CsPlanFilterCounts, PlanRow } from "@/lib/gql/graphql";
import {
  AllocationPill,
  DoaPill,
  OnboardingPill,
  PaymentPill,
  formatShortDate,
  planCustomerInitials,
  planCustomerName,
} from "./status-pills";
import { PlanDetailDrawer } from "./drawers/PlanDetailDrawer";

interface Props {
  /** One page of plans, already filtered/searched/sorted by the BE. */
  plans: PlanRow[];
  totalAssigned: number;
  /** Rows matching the active filter + search, before pagination. */
  totalPlans: number;
  /** Book-wide per-chip counts — unaffected by the active filter. */
  filterCounts: CsPlanFilterCounts;
  page: number;
  limit: number;
  isFetching?: boolean;
}

const FILTERS: {
  key: CsPlanFilter;
  label: string;
  count: (c: CsPlanFilterCounts) => number;
}[] = [
  { key: CsPlanFilter.All, label: "All", count: (c) => c.all },
  {
    key: CsPlanFilter.DueAllocation,
    label: "Due allocation",
    count: (c) => c.dueAllocation,
  },
  {
    key: CsPlanFilter.OnboardingPending,
    label: "Onboarding pending",
    count: (c) => c.onboardingPending,
  },
  { key: CsPlanFilter.DueDoa, label: "Due DoA", count: (c) => c.dueDoa },
  {
    key: CsPlanFilter.DefaultingSoon,
    label: "Defaulting soon",
    count: (c) => c.defaultingSoon,
  },
  {
    key: CsPlanFilter.CompletedPayment,
    label: "Completed payment",
    count: (c) => c.completedPayment,
  },
];

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

export function CustomersTable({
  plans,
  totalAssigned,
  totalPlans,
  filterCounts,
  page,
  limit,
  isFetching = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hold the id, not the row: mutations in the drawer invalidate the dashboard,
  // and deriving from the refetched page keeps the drawer's pills live.
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);

  const activeFilter =
    (searchParams.get("filter") as CsPlanFilter | null) ?? CsPlanFilter.All;
  const searchParam = searchParams.get("search") ?? "";

  // Local input state so typing stays responsive; the URL (and the query)
  // only move once typing settles.
  const [q, setQ] = useState(searchParam);
  const debouncedQ = useDebounce(q, 400);

  // Resync when the URL changes from elsewhere (back button, manager switch).
  // Adjusted during render rather than in an effect — React re-renders before
  // committing, so there's no flash of the stale value.
  const [lastSearchParam, setLastSearchParam] = useState(searchParam);
  if (searchParam !== lastSearchParam) {
    setLastSearchParam(searchParam);
    setQ(searchParam);
  }

  const pushParams = (mutate: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    // Any change to the result set restarts paging.
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (debouncedQ === searchParam) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ.trim()) params.set("search", debouncedQ.trim());
    else params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
    // searchParams/router are stable enough here; re-running on every render
    // would fight the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const setFilter = (key: CsPlanFilter) =>
    pushParams((p) => {
      if (key === CsPlanFilter.All) p.delete("filter");
      else p.set("filter", key);
    });

  const openPlan = openPlanId
    ? plans.find((p) => p.planId === openPlanId) ?? null
    : null;

  const rangeStart = totalPlans === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalPlans);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">Purchases</h2>
        <span className="text-xs text-gray-500">
          {rangeStart}–{rangeEnd} of {totalPlans.toLocaleString()} plan
          {totalPlans === 1 ? "" : "s"} across {totalAssigned} customer
          {totalAssigned === 1 ? "" : "s"}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors",
                    active
                      ? "bg-[#00695C] text-white border-[#00695C]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "tabular-nums text-[11px]",
                      active ? "opacity-90" : "text-gray-400"
                    )}
                  >
                    {f.count(filterCounts).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer name, email, or asset…"
            className="h-8 text-xs w-56"
          />
        </div>

        <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Onboarding</th>
                <th className="px-4 py-2.5 font-medium">Allocation</th>
                <th className="px-4 py-2.5 font-medium">DoA</th>
                <th className="px-4 py-2.5 font-medium">Last activity</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500 text-sm"
                  >
                    {searchParam || activeFilter !== CsPlanFilter.All
                      ? "No plans match this filter."
                      : "No plans in this book yet."}
                  </td>
                </tr>
              ) : (
                plans.map((r) => (
                  <tr
                    key={r.planId}
                    className="border-t border-gray-100 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold">
                          {planCustomerInitials(r.customer)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 leading-tight">
                              {planCustomerName(r.customer)}
                            </p>
                            {r.priorPlansCount > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5"
                                title={`Repeat buyer · ${r.priorPlansCount} prior plan${r.priorPlansCount === 1 ? "" : "s"}`}
                              >
                                <Repeat className="h-2.5 w-2.5" />
                                +{r.priorPlansCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-tight">
                            {r.customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p className="leading-tight">{r.asset}</p>
                      <p className="text-xs text-gray-500 leading-tight">
                        {r.product === "flex" ? "Flex" : "Full-ownership"} ·
                        opened {formatShortDate(r.purchaseDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <PaymentPill
                        status={r.paymentStatus}
                        label={r.paymentLabel}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <OnboardingPill status={r.onboarding} />
                    </td>
                    <td className="px-4 py-3">
                      <AllocationPill
                        status={r.allocation}
                        label={r.allocationLabel}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <DoaPill status={r.doa} label={r.doaLabel} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                      {timeAgo(r.lastActivityAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenPlanId(r.planId)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C] border border-gray-200 rounded-md px-2 py-1"
                      >
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>
            Showing {plans.length} of {totalPlans.toLocaleString()} matching plan
            {totalPlans === 1 ? "" : "s"}
          </span>
          <Pagination count={totalPlans} currentIdx={page} limit={limit} />
        </div>
      </div>

      <PlanDetailDrawer
        plan={openPlan}
        open={!!openPlan}
        onOpenChange={(o) => !o && setOpenPlanId(null)}
      />
    </section>
  );
}
