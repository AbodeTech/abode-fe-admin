"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useExportRecoveryPlans } from "../hooks/use-export-recovery-plans";
import {
  PRODUCT_LABELS,
  customerInitials,
  customerName,
  formatNaira,
  formatShortDate,
  recoveryStateLabel,
  suspensionDisplay,
} from "../lib/format";
import type {
  FinancialOfficerDashboard,
  RecoveryFilterKey,
  RecoveryPlanRow,
} from "../schemas/financial-officer.schema";
import { RecoveryPlanDrawer } from "./RecoveryPlanDrawer";
import { RecoveryStatePill, SuspensionPill } from "./recovery-pills";

interface Props {
  officerId: string;
  /** One page, already filtered and searched by the BE. */
  plans: RecoveryPlanRow[];
  /** Rows matching the active filter + search, before pagination. */
  totalPlans: number;
  /** Book-wide per-chip counts, unaffected by the active filter. */
  filterCounts: FinancialOfficerDashboard["filter_counts"];
  page: number;
  limit: number;
  isFetching?: boolean;
  /** Super admins can move a plan to another officer from the drawer. */
  canReassign: boolean;
}

const FILTERS: { key: RecoveryFilterKey; label: string; urgent?: boolean }[] = [
  { key: "in_book", label: "In book" },
  { key: "final_month", label: "Final month, behind" },
  { key: "past_due", label: "Past final due date" },
  { key: "suspending_soon", label: "Suspends within 14 days", urgent: true },
  { key: "cleared", label: "Cleared" },
  { key: "suspended", label: "Suspended" },
];

const ENTRY_REASON: Record<RecoveryPlanRow["entry_reason"], string> = {
  final_month_behind: "behind in final month",
  past_final_due: "past final due date",
};

export function RecoveryPlansTable({
  officerId,
  plans,
  totalPlans,
  filterCounts,
  page,
  limit,
  isFetching = false,
  canReassign,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exportPlans = useExportRecoveryPlans();
  const [openRow, setOpenRow] = useState<{ planId: string; assignmentId: string } | null>(null);

  const activeFilter = (searchParams.get("filter") as RecoveryFilterKey | null) ?? "in_book";
  const searchParam = searchParams.get("search") ?? "";

  // Local input state so typing stays responsive; the URL only moves once it settles.
  const [q, setQ] = useState(searchParam);
  const debouncedQ = useDebounce(q, 400);

  // Resync when the URL changes from elsewhere (back button, officer switch).
  const [lastSearchParam, setLastSearchParam] = useState(searchParam);
  if (searchParam !== lastSearchParam) {
    setLastSearchParam(searchParam);
    setQ(searchParam);
  }

  useEffect(() => {
    if (debouncedQ === searchParam) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ.trim()) params.set("search", debouncedQ.trim());
    else params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
    // Re-running on every render would fight the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const setFilter = (key: RecoveryFilterKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "in_book") params.delete("filter");
    else params.set("filter", key);
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleExport = () => {
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    exportPlans.mutate(
      {
        officerId,
        month: month ? Number(month) : undefined,
        year: year ? Number(year) : undefined,
        filter: activeFilter,
        search: searchParam || undefined,
      },
      {
        onSuccess: ({ filename }) => toast.success(`Exported ${filename}`),
        onError: (err) => toast.error(err.message || "Export failed"),
      }
    );
  };

  const rangeStart = totalPlans === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalPlans);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">Recovery book</h2>
        <span className="text-xs text-gray-500">
          Plans enter automatically when they&apos;re behind in their final month, or past their final due date.
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
                      : cn(
                          "bg-white border-gray-200 hover:border-gray-300",
                          f.urgent && filterCounts[f.key] > 0 ? "text-[#AD1F2A]" : "text-gray-600"
                        )
                  )}
                >
                  {f.label}
                  <span className={cn("tabular-nums text-[11px]", active ? "opacity-90" : "text-gray-400")}>
                    {filterCounts[f.key].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer or asset…"
              aria-label="Search customer or asset"
              className="h-8 text-xs w-56"
            />
            <Button
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
            </Button>
          </div>
        </div>

        <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Entered book</th>
                <th className="px-4 py-2.5 font-medium">Now</th>
                <th className="px-4 py-2.5 font-medium">Suspends</th>
                <th className="px-4 py-2.5 font-medium text-right">Balance</th>
                <th className="px-4 py-2.5 font-medium text-right">Recovered</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 text-sm">
                    {searchParam || activeFilter !== "in_book"
                      ? "No plans match this filter."
                      : "No plans in this book right now."}
                  </td>
                </tr>
              ) : (
                plans.map((p) => {
                  const suspension = suspensionDisplay(p);
                  return (
                    <tr key={p.assignment_id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold shrink-0">
                            {customerInitials(p.customer)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 leading-tight">{customerName(p.customer)}</p>
                            <p className="text-xs text-gray-500 leading-tight truncate">{p.customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <p className="leading-tight">{p.asset}</p>
                        <p className="text-xs text-gray-500 leading-tight">
                          {PRODUCT_LABELS[p.product]} · {p.tenor_months} months
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="leading-tight text-gray-700">{formatShortDate(p.entered_book_at)}</p>
                        <p className="text-xs text-gray-500 leading-tight">{ENTRY_REASON[p.entry_reason]}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{recoveryStateLabel(p)}</td>
                      <td className="px-4 py-3">
                        <SuspensionPill {...suspension} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNaira(p.balance)}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums",
                          p.recovered_since_assigned > 0 ? "text-[#00695C] font-semibold" : "text-gray-400"
                        )}
                      >
                        {formatNaira(p.recovered_since_assigned)}
                      </td>
                      <td className="px-4 py-3">
                        <RecoveryStatePill state={p.state} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setOpenRow({ planId: p.plan_id, assignmentId: p.assignment_id })}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C] border border-gray-200 rounded-md px-2 py-1"
                          aria-label={`Open ${customerName(p.customer)}'s plan`}
                        >
                          Open
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>
            {rangeStart}–{rangeEnd} of {totalPlans.toLocaleString()} plan{totalPlans === 1 ? "" : "s"}
          </span>
          <Pagination count={totalPlans} currentIdx={page} limit={limit} />
        </div>
      </div>

      <RecoveryPlanDrawer
        planId={openRow?.planId ?? null}
        assignmentId={openRow?.assignmentId ?? null}
        onAssignmentChange={(id) => setOpenRow((row) => (row ? { ...row, assignmentId: id } : row))}
        onOpenChange={(o) => !o && setOpenRow(null)}
        canReassign={canReassign}
      />
    </section>
  );
}
