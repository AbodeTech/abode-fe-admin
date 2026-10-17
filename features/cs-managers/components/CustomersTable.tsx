"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Download, Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type {
  CSManagerDashboard,
  EstateOption,
  PlanFilterKey,
  PlanRow,
} from "../schemas/cs-manager.schema";
import {
  AllocationPill,
  DoaPill,
  LastAttemptNote,
  OnboardingPill,
  PaymentPill,
  allocationStatusLabel,
  formatShortDate,
  planCustomerInitials,
  planCustomerName,
  planLandLabel,
  productLabel,
  telHref,
} from "./status-pills";
import { PlanDetailDrawer } from "./PlanDetailDrawer";
import { useExportDashboardPlans } from "../hooks/use-export-dashboard-plans";

interface Props {
  managerId: string | null;
  /** One page of plans, already filtered/searched/sorted by the BE. */
  plans: PlanRow[];
  totalAssigned: number;
  /** Rows matching the active filter + search, before pagination. */
  totalPlans: number;
  /** Per-chip counts — unaffected by the active chip, narrowed by the estate. */
  filterCounts: CSManagerDashboard["filter_counts"];
  /** Every estate in the book, for the estate filter. */
  estates: EstateOption[];
  page: number;
  limit: number;
  isFetching?: boolean;
}

const FILTERS: { key: PlanFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "due_allocation", label: "Due allocation" },
  { key: "onboarding_pending", label: "Onboarding pending" },
  // The three states inside that chip: a plan nobody has rung, one where the
  // customer did not pick up, and one with a call booked — three different jobs.
  { key: "never_attempted", label: "Never rung" },
  { key: "no_answer", label: "Didn't pick" },
  { key: "rescheduled", label: "Call booked" },
  { key: "due_doa", label: "Due DoA" },
  { key: "defaulting_soon", label: "Defaulting soon" },
  { key: "completed_payment", label: "Completed payment" },
];

/** Radix Select can't hold an empty value, so "no estate" needs a sentinel. */
const ALL_ESTATES = "__all__";

const timeAgo = (iso: string | null) => {
  if (!iso) return "—";
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
  managerId,
  plans,
  totalAssigned,
  totalPlans,
  filterCounts,
  estates,
  page,
  limit,
  isFetching = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exportPlans = useExportDashboardPlans();

  // Hold the id, not the row: mutations in the drawer invalidate the dashboard,
  // and deriving from the refetched page keeps the drawer's pills live.
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);

  const activeFilter = (searchParams.get("filter") as PlanFilterKey | null) ?? "all";
  const searchParam = searchParams.get("search") ?? "";
  const estateParam = searchParams.get("estate") ?? "";

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

  const setFilter = (key: PlanFilterKey) =>
    pushParams((p) => {
      if (key === "all") p.delete("filter");
      else p.set("filter", key);
    });

  const setEstate = (name: string) =>
    pushParams((p) => {
      if (name === ALL_ESTATES) p.delete("estate");
      else p.set("estate", name);
    });

  // A chip whose count the BE doesn't send yet would 400 on click — hide it.
  const visibleFilters = FILTERS.filter((f) => filterCounts[f.key] !== undefined);

  // An estate in the URL that this book doesn't hold (say, after switching
  // manager) still needs an item, or the trigger would read "All estates"
  // over an empty table.
  const estateOptions: EstateOption[] =
    estateParam && !estates.some((e) => e.name === estateParam)
      ? [...estates, { name: estateParam, plans: 0, due_allocation: 0 }]
      : estates;

  const openPlan = openPlanId ? plans.find((p) => p.plan_id === openPlanId) ?? null : null;

  const rangeStart = totalPlans === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalPlans);

  const handleExport = () => {
    if (!managerId) return;
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    exportPlans.mutate(
      {
        managerId,
        month: month ? Number(month) : undefined,
        year: year ? Number(year) : undefined,
        filter: activeFilter,
        search: searchParam || undefined,
        estate: estateParam || undefined,
      },
      {
        onSuccess: ({ filename }) => toast.success(`Exported ${filename}`),
        onError: (err) => toast.error(err.message || "Export failed"),
      }
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">Purchases</h2>
        <span className="text-xs text-gray-500">
          {rangeStart}–{rangeEnd} of {totalPlans.toLocaleString()} plan{totalPlans === 1 ? "" : "s"} across{" "}
          {totalAssigned} customer{totalAssigned === 1 ? "" : "s"}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-1.5">
            {visibleFilters.map((f) => {
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
                  <span className={cn("tabular-nums text-[11px]", active ? "opacity-90" : "text-gray-400")}>
                    {(filterCounts[f.key] ?? 0).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {estateOptions.length > 0 && (
              <Select value={estateParam || ALL_ESTATES} onValueChange={setEstate}>
                <SelectTrigger size="sm" className="h-8 text-xs w-fit min-w-40 max-w-64 bg-white">
                  {/* The name alone in the trigger; the counts are for choosing. */}
                  <SelectValue placeholder="All estates">{estateParam || "All estates"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ESTATES} className="text-xs">
                    All estates
                  </SelectItem>
                  {estateOptions.map((e) => (
                    <SelectItem key={e.name} value={e.name} className="text-xs">
                      <span className="flex flex-col">
                        <span>{e.name}</span>
                        <span className="text-[11px] text-gray-500 tabular-nums">
                          {e.plans.toLocaleString()} plan{e.plans === 1 ? "" : "s"}
                          {e.due_allocation > 0 && (
                            <span className="text-[#AD1F2A]">
                              {" · "}
                              {e.due_allocation.toLocaleString()} due allocation
                            </span>
                          )}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone or estate…"
              title="A phone number matches on 4 or more digits, in any spacing"
              className="h-8 text-xs w-56"
            />
            {managerId && <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleExport}
              disabled={exportPlans.isPending}
            >
              {exportPlans.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Download className="h-3.5 w-3.5" aria-hidden />
              )}
              Export
            </Button>}
          </div>
        </div>

        <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Onboarding</th>
                <th className="px-4 py-2.5 font-medium">Allocation</th>
                <th className="px-4 py-2.5 font-medium">DoA</th>
                <th className="px-4 py-2.5 font-medium">Last activity</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 text-sm">
                    {searchParam || estateParam || activeFilter !== "all"
                      ? "No plans match this filter."
                      : "No plans in this book yet."}
                  </td>
                </tr>
              ) : (
                plans.map((r) => (
                  <tr key={r.plan_id} className="border-t border-gray-100 hover:bg-gray-50/60">
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
                            {r.prior_plans_count > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5"
                                title={`Repeat buyer · ${r.prior_plans_count} prior plan${r.prior_plans_count === 1 ? "" : "s"}`}
                              >
                                <Repeat className="h-2.5 w-2.5" />+{r.prior_plans_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-tight">{r.customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.customer.phone ? (
                        // A queue row is read to place a call, so the number dials.
                        <a
                          href={telHref(r.customer.phone)}
                          className="text-xs text-gray-700 tabular-nums hover:text-[#00695C]"
                        >
                          {r.customer.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p className="leading-tight">{r.asset || "—"}</p>
                      <p className="text-xs text-gray-500 leading-tight">
                        {[r.location, planLandLabel(r)].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-gray-500 leading-tight">
                        {productLabel(r.product)} · opened {formatShortDate(r.purchase_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <PaymentPill status={r.payment_status} label={r.payment_label} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <OnboardingPill status={r.onboarding} />
                      {/* What was already tried, so the next call is an informed one. */}
                      <LastAttemptNote attempt={r.last_attempt} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <AllocationPill status={r.allocation} label={r.allocation_label} />
                      {/* The status stored on the plan, beside the pill the BE
                          derives. Skipped where it would only repeat the pill. */}
                      {r.allocation_status && !(r.allocation === "allocated" && r.allocation_status === "allocated") && (
                        <span className="mt-1 block text-[11px] text-gray-500">
                          Status: {allocationStatusLabel(r.allocation_status)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DoaPill status={r.doa} label={r.doa_label} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                      {timeAgo(r.last_activity_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenPlanId(r.plan_id)}
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
            Showing {plans.length} of {totalPlans.toLocaleString()} matching plan{totalPlans === 1 ? "" : "s"}
          </span>
          <Pagination count={totalPlans} currentIdx={page} limit={limit} />
        </div>
      </div>

      <PlanDetailDrawer plan={openPlan} open={!!openPlan} onOpenChange={(o) => !o && setOpenPlanId(null)} />
    </section>
  );
}
