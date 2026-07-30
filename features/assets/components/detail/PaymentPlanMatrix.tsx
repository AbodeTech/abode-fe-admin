"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, PieChart } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { SampleDataChip } from "../analytics/SampleDataChip";
import type { PlanPerformance, SizePlanBreakdown } from "../analytics/sample-data";

function formatNaira(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatSqm(sqm: number | null | undefined): string {
  if (sqm == null || sqm === 0) return "—";
  return `${sqm.toLocaleString()} SQM`;
}

/** Size rows are the sum of their plans — the backend sends no group totals. */
function totalsFor(plans: PlanPerformance[]) {
  const sum = (pick: (plan: PlanPerformance) => number) =>
    plans.reduce((total, plan) => total + pick(plan), 0);

  return {
    startValue: sum((p) => p.startValue),
    soldValue: sum((p) => p.soldValue),
    sqmSold: sum((p) => p.sqmSold),
    sqmRemaining: sum((p) => p.sqmRemaining),
    transactions: sum((p) => p.transactions),
    defaultedCount: sum((p) => p.defaultingUsers),
    defaultedValue: sum((p) => p.defaultedValue),
    defaultedBalance: sum((p) => p.defaultedBalance),
    terminatedCount: sum((p) => p.terminatedPlans),
    terminatedValue: sum((p) => p.terminatedValue),
    terminatedBalance: sum((p) => p.terminatedBalance),
  };
}

function efficiencyColour(efficiency: number): string {
  if (efficiency > 90) return "bg-emerald-500";
  if (efficiency > 75) return "bg-amber-500";
  return "bg-rose-500";
}

function EfficiencyBar({ plan }: { plan: PlanPerformance }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs font-bold tabular-nums">{plan.efficiency.toFixed(0)}%</span>
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(plan.efficiency)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${plan.name} collection efficiency`}
      >
        <div
          className={cn("h-full rounded-full", efficiencyColour(plan.efficiency))}
          style={{ width: `${plan.efficiency}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  /** ⛔ ticket 17 — no per-asset analytics endpoint; this is `SAMPLE_SIZE_PLANS`. */
  data: SizePlanBreakdown[];
}

export function PaymentPlanMatrix({ data }: Props) {
  const [collapsed, setCollapsed] = useState<string[]>([]);

  // Collapsed-by-exception, so a size added to the data later starts open
  // rather than silently hidden.
  const isOpen = (size: string) => !collapsed.includes(size);

  const toggleSize = (size: string) =>
    setCollapsed((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6">
        <PieChart className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <h3 className="text-lg font-bold tracking-tight sm:text-xl">
          Payment plan performance
        </h3>
        <SampleDataChip />
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No plan performance for this asset.
        </div>
      ) : (
        <>
          {/* ── desktop ─────────────────────────────────────────────── */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead colSpan={7} className="py-2" />
                  <TableHead
                    colSpan={3}
                    className="border-l py-2 text-center text-[10px] font-bold uppercase tracking-wider text-rose-600"
                  >
                    Defaults
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border-l py-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-600"
                  >
                    Terminations
                  </TableHead>
                  <TableHead className="border-l py-2" />
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Plan / Size
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Start Value
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Sold Value
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    SQM Sold
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    SQM Remaining
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Transactions
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap border-l text-[10px] font-bold uppercase tracking-wider">
                    Count
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Value
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Balance
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap border-l text-[10px] font-bold uppercase tracking-wider">
                    Count
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Value
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Balance
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap border-l text-right text-[10px] font-bold uppercase tracking-wider">
                    Efficiency
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((group) => {
                  const open = isOpen(group.size);
                  const totals = totalsFor(group.plans);

                  return (
                    <Fragment key={group.size}>
                      <TableRow
                        className="cursor-pointer bg-muted/20 hover:bg-muted/40"
                        onClick={() => toggleSize(group.size)}
                      >
                        <TableCell>
                          {open ? (
                            <ChevronDown className="h-4 w-4" aria-hidden />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          )}
                          <span className="sr-only">
                            {open ? "Collapse" : "Expand"} {group.size} SQM
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-black uppercase tracking-widest">
                          {group.size} SQM
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatNaira(totals.startValue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatNaira(totals.soldValue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatSqm(totals.sqmSold)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatSqm(totals.sqmRemaining)}
                        </TableCell>
                        <TableCell className="text-xs font-bold tabular-nums">
                          {totals.transactions}
                        </TableCell>
                        <TableCell className="border-l">
                          <span
                            className={cn(
                              "text-xs font-bold tabular-nums",
                              totals.defaultedCount > 0 ? "text-rose-600" : "text-muted-foreground"
                            )}
                          >
                            {totals.defaultedCount || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums text-rose-600">
                          {formatNaira(totals.defaultedValue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums text-rose-500">
                          {formatNaira(totals.defaultedBalance)}
                        </TableCell>
                        <TableCell className="border-l">
                          <span
                            className={cn(
                              "text-xs font-bold tabular-nums",
                              totals.terminatedCount > 0
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            )}
                          >
                            {totals.terminatedCount || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums text-amber-600">
                          {formatNaira(totals.terminatedValue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums text-amber-500">
                          {formatNaira(totals.terminatedBalance)}
                        </TableCell>
                        <TableCell className="border-l" />
                      </TableRow>

                      {open &&
                        group.plans.map((plan) => (
                          <TableRow key={`${group.size}-${plan.name}`} className="hover:bg-muted/20">
                            <TableCell />
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="whitespace-nowrap text-sm font-bold">
                                  {plan.name}
                                </span>
                                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                  Payment scheme
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatNaira(plan.startValue)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatNaira(plan.soldValue)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatSqm(plan.sqmSold)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatSqm(plan.sqmRemaining)}
                            </TableCell>
                            <TableCell className="text-sm font-bold tabular-nums">
                              {plan.transactions}
                            </TableCell>
                            <TableCell className="border-l">
                              <span
                                className={cn(
                                  "text-sm font-bold tabular-nums",
                                  plan.defaultingUsers > 0
                                    ? "text-rose-600"
                                    : "text-muted-foreground"
                                )}
                              >
                                {plan.defaultingUsers || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-rose-600">
                              {formatNaira(plan.defaultedValue)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-rose-500">
                              {formatNaira(plan.defaultedBalance)}
                            </TableCell>
                            <TableCell className="border-l">
                              <span
                                className={cn(
                                  "text-sm font-bold tabular-nums",
                                  plan.terminatedPlans > 0
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                                )}
                              >
                                {plan.terminatedPlans || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-amber-600">
                              {formatNaira(plan.terminatedValue)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-amber-500">
                              {formatNaira(plan.terminatedBalance)}
                            </TableCell>
                            <TableCell className="border-l text-right">
                              <EfficiencyBar plan={plan} />
                            </TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── mobile ──────────────────────────────────────────────── */}
          <div className="space-y-3 md:hidden">
            {data.map((group) => {
              const open = isOpen(group.size);
              const totals = totalsFor(group.plans);

              return (
                <div key={group.size} className="overflow-hidden rounded-xl border">
                  <button
                    type="button"
                    onClick={() => toggleSize(group.size)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 bg-muted/20 px-4 py-3 text-left"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {group.size} SQM
                    </span>
                    <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">
                      {formatNaira(totals.soldValue)}
                    </span>
                  </button>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t px-4 py-3">
                    <Stat label="Start value" value={formatNaira(totals.startValue)} />
                    <Stat label="Sold value" value={formatNaira(totals.soldValue)} />
                    <Stat label="SQM sold" value={formatSqm(totals.sqmSold)} />
                    <Stat label="SQM remaining" value={formatSqm(totals.sqmRemaining)} />
                    <Stat label="Transactions" value={String(totals.transactions)} />
                    <Stat
                      label="Defaulted"
                      value={`${totals.defaultedCount} · ${formatNaira(totals.defaultedBalance)}`}
                      tone={totals.defaultedCount > 0 ? "danger" : undefined}
                    />
                  </dl>

                  {open &&
                    group.plans.map((plan) => (
                      <div key={plan.name} className="border-t bg-muted/10 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold">{plan.name}</span>
                          <EfficiencyBar plan={plan} />
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <Stat label="Start value" value={formatNaira(plan.startValue)} />
                          <Stat label="Sold value" value={formatNaira(plan.soldValue)} />
                          <Stat label="SQM sold" value={formatSqm(plan.sqmSold)} />
                          <Stat label="SQM remaining" value={formatSqm(plan.sqmRemaining)} />
                          <Stat label="Transactions" value={String(plan.transactions)} />
                          <Stat
                            label="Defaults"
                            value={`${plan.defaultingUsers || 0} · ${formatNaira(plan.defaultedBalance)}`}
                            tone={plan.defaultingUsers > 0 ? "danger" : undefined}
                          />
                          <Stat
                            label="Terminations"
                            value={`${plan.terminatedPlans || 0} · ${formatNaira(plan.terminatedBalance)}`}
                            tone={plan.terminatedPlans > 0 ? "warning" : undefined}
                          />
                        </dl>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warning";
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm font-medium tabular-nums wrap-break-word",
          tone === "danger" && "text-rose-600",
          tone === "warning" && "text-amber-600"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
