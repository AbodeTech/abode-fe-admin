"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CustomerRow,
  OnboardingStatus,
  AllocationStatus,
  DoaStatus,
  CustomerPurchaseStatus,
} from "../types";

interface Props {
  customers: CustomerRow[];
  totalAssigned: number;
}

type FilterKey =
  | "all"
  | "due_allocation"
  | "onboarding_pending"
  | "due_doa"
  | "defaulting_soon"
  | "completed_payment";

const FILTERS: { key: FilterKey; label: string; count: (rows: CustomerRow[]) => number }[] = [
  { key: "all", label: "All", count: (rows) => rows.length },
  {
    key: "due_allocation",
    label: "Due allocation",
    count: (rows) => rows.filter((r) => r.allocation === "awaiting").length,
  },
  {
    key: "onboarding_pending",
    label: "Onboarding pending",
    count: (rows) =>
      rows.filter(
        (r) => r.onboarding === "call_pending" || r.onboarding === "disputed"
      ).length,
  },
  {
    key: "due_doa",
    label: "Due DoA",
    count: (rows) => rows.filter((r) => r.doa === "not_sent").length,
  },
  {
    key: "defaulting_soon",
    label: "Defaulting soon",
    count: (rows) =>
      rows.filter((r) => r.paymentStatus === "close_to_default").length,
  },
  {
    key: "completed_payment",
    label: "Completed payment",
    count: (rows) => rows.filter((r) => r.paymentStatus === "completed").length,
  },
];

const applyFilter = (rows: CustomerRow[], f: FilterKey): CustomerRow[] => {
  switch (f) {
    case "due_allocation":
      return rows.filter((r) => r.allocation === "awaiting");
    case "onboarding_pending":
      return rows.filter(
        (r) => r.onboarding === "call_pending" || r.onboarding === "disputed"
      );
    case "due_doa":
      return rows.filter((r) => r.doa === "not_sent");
    case "defaulting_soon":
      return rows.filter((r) => r.paymentStatus === "close_to_default");
    case "completed_payment":
      return rows.filter((r) => r.paymentStatus === "completed");
    default:
      return rows;
  }
};

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

const initialsOf = (r: CustomerRow) =>
  ((r.lastName?.[0] ?? "") + (r.firstName?.[0] ?? "")).toUpperCase();

const fullName = (r: CustomerRow) =>
  `${r.lastName ?? ""} ${r.firstName ?? ""}`.trim();

export function CustomersTable({ customers, totalAssigned }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const filtered = applyFilter(customers, filter);
    if (!q) return filtered;
    const needle = q.toLowerCase();
    return filtered.filter(
      (r) =>
        r.firstName.toLowerCase().includes(needle) ||
        r.lastName.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle)
    );
  }, [customers, filter, q]);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">Customers</h2>
        <span className="text-xs text-gray-500">
          Roster · {totalAssigned} total
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const n = f.count(customers);
              const active = filter === f.key;
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
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer name or email…"
            className="h-8 text-xs w-56"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Purchase</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Onboarding</th>
                <th className="px-4 py-2.5 font-medium">Allocation</th>
                <th className="px-4 py-2.5 font-medium">DoA</th>
                <th className="px-4 py-2.5 font-medium">Last activity</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No customers match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold">
                          {initialsOf(r)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">
                            {fullName(r)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.estate} · {r.product === "flex" ? "Flex" : "Full-ownership"}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentPill status={r.paymentStatus} label={r.paymentLabel} />
                    </td>
                    <td className="px-4 py-3">
                      <OnboardingPill status={r.onboarding} />
                    </td>
                    <td className="px-4 py-3">
                      <AllocationPill status={r.allocation} label={r.allocationLabel} />
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
                        className="text-xs text-gray-500 hover:text-[#00695C] border border-gray-200 rounded-md px-2 py-1"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>
            Showing {rows.length} of {customers.length} customers
          </span>
          {/* Pagination controls wire up once BE ships a real page/limit query */}
        </div>
      </div>
    </section>
  );
}

/* Pill helpers — tiny local components so the table markup stays readable */

const PILL_BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

function PaymentPill({
  status,
  label,
}: {
  status: CustomerPurchaseStatus;
  label: string;
}) {
  const cls =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "close_to_default"
      ? "bg-red-50 text-[#AD1F2A]"
      : "bg-[#E0F2F1] text-[#00695C]";
  return <span className={cn(PILL_BASE, cls)}>{label}</span>;
}

function OnboardingPill({ status }: { status: OnboardingStatus }) {
  switch (status) {
    case "confirmed":
      return <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>Confirmed</span>;
    case "call_pending":
      return <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700")}>Call pending</span>;
    case "disputed":
      return <span className={cn(PILL_BASE, "bg-red-50 text-[#AD1F2A]")}>Disputed</span>;
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

function AllocationPill({
  status,
  label,
}: {
  status: AllocationStatus;
  label?: string;
}) {
  switch (status) {
    case "allocated":
      return (
        <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>
          {label ?? "Allocated"}
        </span>
      );
    case "awaiting":
      return (
        <span className={cn(PILL_BASE, "bg-red-50 text-[#AD1F2A]")}>
          Awaiting
        </span>
      );
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

function DoaPill({ status, label }: { status: DoaStatus; label?: string }) {
  switch (status) {
    case "sent":
      return (
        <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>
          {label ?? "Sent"}
        </span>
      );
    case "not_sent":
      return (
        <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700")}>Not sent</span>
      );
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}
