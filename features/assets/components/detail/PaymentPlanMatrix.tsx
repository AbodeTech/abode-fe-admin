"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, PieChart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { graphql, FragmentType, useFragment } from "@/lib/gql";

export const PaymentPlanMatrixFragment = graphql(`
  fragment PaymentPlanMatrix_statistics on AssetAnalyticsStatistics {
    sizePlanBreakdown {
      size
      plans {
        name
        startValue
        soldValue
        totalSqmSold
        totalSqmRemaining
        totalPlans
        totalDefaultingUsers
        totalDefaultedValue
        totalBalance
        totalTerminatedPlans
        totalTerminatedValue
        totalTerminatedBalance
        efficiency
      }
    }
  }
`);

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

interface Props {
  data: FragmentType<typeof PaymentPlanMatrixFragment> | null | undefined;
}

export function PaymentPlanMatrix({ data }: Props) {
  const stats = useFragment(PaymentPlanMatrixFragment, data);
  const groups = stats?.sizePlanBreakdown ?? [];

  const [expandedSizes, setExpandedSizes] = useState<string[]>(
    groups.map((g) => g?.size ?? "").filter(Boolean)
  );

  const toggleSize = (size: string) => {
    setExpandedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold tracking-tight">Payment Plan Performance Matrix</h3>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full">
          <div className="h-1.5 w-1.5 bg-primary animate-pulse rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Analysis Active</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-background overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            {/* Group header row */}
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead colSpan={2} className="py-2" />
              <TableHead colSpan={5} className="py-2" />
              <TableHead
                colSpan={3}
                className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-rose-600 border-l"
              >
                Defaults
              </TableHead>
              <TableHead
                colSpan={3}
                className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-600 border-l"
              >
                Terminations
              </TableHead>
              <TableHead colSpan={1} className="py-2 border-l" />
            </TableRow>
            {/* Column header row */}
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Plan / Size</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Start Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Sold Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">SQM Sold</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">SQM Remaining</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Transactions</TableHead>
              {/* Defaults */}
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap border-l">Count</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Balance</TableHead>
              {/* Terminations */}
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap border-l">Count</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 whitespace-nowrap">Balance</TableHead>
              {/* Efficiency */}
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-right whitespace-nowrap border-l">Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="h-32 text-center text-muted-foreground italic">
                  No data available for this asset.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => {
                if (!group) return null;
                const isOpen = expandedSizes.includes(group.size ?? "");
                const plans = group.plans ?? [];

                const g = {
                  startValue: plans.reduce((s, p) => s + (p?.startValue ?? 0), 0),
                  soldValue: plans.reduce((s, p) => s + (p?.soldValue ?? 0), 0),
                  sqmSold: plans.reduce((s, p) => s + (p?.totalSqmSold ?? 0), 0),
                  sqmRemaining: plans.reduce((s, p) => s + (p?.totalSqmRemaining ?? 0), 0),
                  totalPlans: plans.reduce((s, p) => s + (p?.totalPlans ?? 0), 0),
                  defaultedCount: plans.reduce((s, p) => s + (p?.totalDefaultingUsers ?? 0), 0),
                  defaultedValue: plans.reduce((s, p) => s + (p?.totalDefaultedValue ?? 0), 0),
                  defaultedBalance: plans.reduce((s, p) => s + (p?.totalBalance ?? 0), 0),
                  terminatedCount: plans.reduce((s, p) => s + (p?.totalTerminatedPlans ?? 0), 0),
                  terminatedValue: plans.reduce((s, p) => s + (p?.totalTerminatedValue ?? 0), 0),
                  terminatedBalance: plans.reduce((s, p) => s + (p?.totalTerminatedBalance ?? 0), 0),
                };

                return (
                  <>
                    {/* Size group row */}
                    <TableRow
                      key={group.size}
                      className="bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleSize(group.size ?? "")}
                    >
                      <TableCell>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-black text-xs uppercase tracking-widest text-slate-900 whitespace-nowrap">
                        {group.size} SQM
                      </TableCell>
                      <TableCell className="text-xs font-bold whitespace-nowrap">{formatNaira(g.startValue)}</TableCell>
                      <TableCell className="text-xs font-bold whitespace-nowrap">{formatNaira(g.soldValue)}</TableCell>
                      <TableCell className="text-xs font-bold whitespace-nowrap">{formatSqm(g.sqmSold)}</TableCell>
                      <TableCell className="text-xs font-bold whitespace-nowrap">{formatSqm(g.sqmRemaining)}</TableCell>
                      <TableCell className="text-xs font-bold tabular-nums">{g.totalPlans}</TableCell>
                      {/* Defaults */}
                      <TableCell className="border-l">
                        <span className={cn("text-xs font-bold", g.defaultedCount > 0 ? "text-rose-600" : "text-muted-foreground")}>
                          {g.defaultedCount || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-rose-600 whitespace-nowrap">{formatNaira(g.defaultedValue)}</TableCell>
                      <TableCell className="text-xs font-bold text-rose-500 whitespace-nowrap">{formatNaira(g.defaultedBalance)}</TableCell>
                      {/* Terminations */}
                      <TableCell className="border-l">
                        <span className={cn("text-xs font-bold", g.terminatedCount > 0 ? "text-amber-600" : "text-muted-foreground")}>
                          {g.terminatedCount || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-amber-600 whitespace-nowrap">{formatNaira(g.terminatedValue)}</TableCell>
                      <TableCell className="text-xs font-bold text-amber-500 whitespace-nowrap">{formatNaira(g.terminatedBalance)}</TableCell>
                      <TableCell className="border-l" />
                    </TableRow>

                    {/* Plan rows */}
                    {isOpen && plans.map((plan, i) => {
                      if (!plan) return null;
                      const efficiency = plan.efficiency ?? 0;
                      return (
                        <TableRow key={`${group.size}-${i}`} className="hover:bg-muted/20 border-l-2 border-l-primary/10">
                          <TableCell />
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold whitespace-nowrap">{plan.name}</span>
                              <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Payment Scheme</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatNaira(plan.startValue)}</TableCell>
                          <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatNaira(plan.soldValue)}</TableCell>
                          <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSqm(plan.totalSqmSold)}</TableCell>
                          <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSqm(plan.totalSqmRemaining)}</TableCell>
                          <TableCell className="text-sm font-bold tabular-nums">{plan.totalPlans ?? 0}</TableCell>
                          {/* Defaults */}
                          <TableCell className="border-l">
                            <span className={cn("text-sm font-bold", (plan.totalDefaultingUsers ?? 0) > 0 ? "text-rose-600" : "text-muted-foreground")}>
                              {plan.totalDefaultingUsers || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-medium tabular-nums text-rose-600 whitespace-nowrap">{formatNaira(plan.totalDefaultedValue)}</TableCell>
                          <TableCell className="text-sm font-medium tabular-nums text-rose-500 whitespace-nowrap">{formatNaira(plan.totalBalance)}</TableCell>
                          {/* Terminations */}
                          <TableCell className="border-l">
                            <span className={cn("text-sm font-bold", (plan.totalTerminatedPlans ?? 0) > 0 ? "text-amber-600" : "text-muted-foreground")}>
                              {plan.totalTerminatedPlans || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-medium tabular-nums text-amber-600 whitespace-nowrap">{formatNaira(plan.totalTerminatedValue)}</TableCell>
                          <TableCell className="text-sm font-medium tabular-nums text-amber-500 whitespace-nowrap">{formatNaira(plan.totalTerminatedBalance)}</TableCell>
                          {/* Efficiency */}
                          <TableCell className="text-right border-l">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-bold">{efficiency.toFixed(0)}%</span>
                              <div
                                className="h-1.5 w-16 bg-muted rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={efficiency}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${plan.name} Collection Efficiency`}
                              >
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    efficiency > 90 ? "bg-emerald-500" : efficiency > 75 ? "bg-amber-500" : "bg-rose-500"
                                  )}
                                  style={{ width: `${efficiency}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
