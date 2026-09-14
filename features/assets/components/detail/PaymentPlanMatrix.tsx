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

import {
  planTenorLabel,
  type AssetSizePlanBreakdown,
  type AssetSizePlanGroup,
} from "../../schemas/asset-analytics.schema";

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

/**
 * `sold_value`, `sqm_sold`, `units_sold` and `efficiency` come from the group
 * itself — the BE measures them against the size's capacity, so re-deriving
 * them by summing tenor rows would disagree with the API. The lifecycle and
 * cash columns have no group-level equivalent and are summed from the rows.
 */
function totalsFor(group: AssetSizePlanGroup) {
  const sum = (pick: (plan: AssetSizePlanBreakdown) => number) =>
    group.plans.reduce((total, plan) => total + pick(plan), 0);

  return {
    soldValue: group.sold_value,
    sqmSold: group.sqm_sold,
    efficiency: group.efficiency,
    moneyReceived: sum((p) => p.money_received),
    balanceOwed: sum((p) => p.balance_owed),
    transactions: sum((p) => p.plan_count),
    defaultedCount: sum((p) => p.defaulting.customers),
    defaultedValue: sum((p) => p.defaulting.value),
    defaultedBalance: sum((p) => p.defaulting.amount_owing),
    terminatedCount: sum((p) => p.terminated.plans),
    terminatedValue: sum((p) => p.terminated.value),
    terminatedBalance: sum((p) => p.terminated.amount_owing),
  };
}

function efficiencyColour(efficiency: number): string {
  if (efficiency > 90) return "bg-emerald-500";
  if (efficiency > 75) return "bg-amber-500";
  return "bg-rose-500";
}

function EfficiencyBar({ efficiency, label }: { efficiency: number; label: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs font-bold tabular-nums">{efficiency.toFixed(0)}%</span>
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(efficiency)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} collection efficiency`}
      >
        <div
          className={cn("h-full rounded-full", efficiencyColour(efficiency))}
          style={{ width: `${Math.min(Math.max(efficiency, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  data: AssetSizePlanGroup[];
}

export function PaymentPlanMatrix({ data }: Props) {
  const [collapsed, setCollapsed] = useState<number[]>([]);

  // Collapsed-by-exception, so a size added to the data later starts open
  // rather than silently hidden.
  const isOpen = (size: number) => !collapsed.includes(size);

  const toggleSize = (size: number) =>
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
                    Sold Value
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Received
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    Balance
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                    SQM Sold
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
                  const totals = totalsFor(group);

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
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest">
                              {group.size} SQM
                            </span>
                            {/* Start value and remaining capacity exist only per
                                size, so they sit here rather than as columns the
                                tenor rows below could never fill. */}
                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                              {formatNaira(group.start_value)} start · {formatSqm(group.sqm_remaining)} left
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatNaira(totals.soldValue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatNaira(totals.moneyReceived)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatNaira(totals.balanceOwed)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-bold tabular-nums">
                          {formatSqm(totals.sqmSold)}
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
                        <TableCell className="border-l text-right">
                          <EfficiencyBar
                            efficiency={totals.efficiency}
                            label={`${group.size} SQM`}
                          />
                        </TableCell>
                      </TableRow>

                      {open &&
                        group.plans.map((plan) => (
                          <TableRow
                            key={`${group.size}-${plan.month_subscription}`}
                            className="hover:bg-muted/20"
                          >
                            <TableCell />
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="whitespace-nowrap text-sm font-bold">
                                  {planTenorLabel(plan.month_subscription)}
                                </span>
                                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                  {plan.units_sold} units sold
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatNaira(plan.sold_value)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatNaira(plan.money_received)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatNaira(plan.balance_owed)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              {formatSqm(plan.sqm_sold)}
                            </TableCell>
                            <TableCell className="text-sm font-bold tabular-nums">
                              {plan.plan_count}
                            </TableCell>
                            <TableCell className="border-l">
                              <span
                                className={cn(
                                  "text-sm font-bold tabular-nums",
                                  plan.defaulting.customers > 0
                                    ? "text-rose-600"
                                    : "text-muted-foreground"
                                )}
                              >
                                {plan.defaulting.customers || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-rose-600">
                              {formatNaira(plan.defaulting.value)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-rose-500">
                              {formatNaira(plan.defaulting.amount_owing)}
                            </TableCell>
                            <TableCell className="border-l">
                              <span
                                className={cn(
                                  "text-sm font-bold tabular-nums",
                                  plan.terminated.plans > 0
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                                )}
                              >
                                {plan.terminated.plans || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-amber-600">
                              {formatNaira(plan.terminated.value)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm tabular-nums text-amber-500">
                              {formatNaira(plan.terminated.amount_owing)}
                            </TableCell>
                            <TableCell className="border-l text-right">
                              <EfficiencyBar
                                efficiency={plan.efficiency}
                                label={planTenorLabel(plan.month_subscription)}
                              />
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
              const totals = totalsFor(group);

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
                    <Stat label="Start value" value={formatNaira(group.start_value)} />
                    <Stat label="Sold value" value={formatNaira(totals.soldValue)} />
                    <Stat label="Received" value={formatNaira(totals.moneyReceived)} />
                    <Stat label="Balance" value={formatNaira(totals.balanceOwed)} />
                    <Stat label="SQM sold" value={formatSqm(totals.sqmSold)} />
                    <Stat label="SQM remaining" value={formatSqm(group.sqm_remaining)} />
                    <Stat label="Transactions" value={String(totals.transactions)} />
                    <Stat
                      label="Defaulted"
                      value={`${totals.defaultedCount} · ${formatNaira(totals.defaultedBalance)}`}
                      tone={totals.defaultedCount > 0 ? "danger" : undefined}
                    />
                  </dl>

                  {open &&
                    group.plans.map((plan) => (
                      <div
                        key={plan.month_subscription}
                        className="border-t bg-muted/10 px-4 py-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold">
                            {planTenorLabel(plan.month_subscription)}
                          </span>
                          <EfficiencyBar
                            efficiency={plan.efficiency}
                            label={planTenorLabel(plan.month_subscription)}
                          />
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <Stat label="Sold value" value={formatNaira(plan.sold_value)} />
                          <Stat label="Received" value={formatNaira(plan.money_received)} />
                          <Stat label="Balance" value={formatNaira(plan.balance_owed)} />
                          <Stat label="SQM sold" value={formatSqm(plan.sqm_sold)} />
                          <Stat label="Units sold" value={String(plan.units_sold)} />
                          <Stat label="Transactions" value={String(plan.plan_count)} />
                          <Stat
                            label="Defaults"
                            value={`${plan.defaulting.customers || 0} · ${formatNaira(plan.defaulting.amount_owing)}`}
                            tone={plan.defaulting.customers > 0 ? "danger" : undefined}
                          />
                          <Stat
                            label="Terminations"
                            value={`${plan.terminated.plans || 0} · ${formatNaira(plan.terminated.amount_owing)}`}
                            tone={plan.terminated.plans > 0 ? "warning" : undefined}
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
