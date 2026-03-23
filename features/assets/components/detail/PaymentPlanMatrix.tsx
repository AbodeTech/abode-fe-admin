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

interface PaymentPlan {
  id: string;
  name: string;
  startValue: number;
  soldValue: number;
  sqmSold: number;
  sqmRemaining: number;
  customers: number;
  defaultedCount: number;
  defaultedValue: number;
  defaultedBalance: number;
  terminatedCount: number;
  terminatedValue: number;
  terminatedBalance: number;
  efficiency: number;
}

interface SizeGroup {
  size: string;
  totalSqm: number;
  plans: PaymentPlan[];
}

const MOCK_DATA: SizeGroup[] = [
  {
    size: "150 SQM",
    totalSqm: 9900,
    plans: [
      {
        id: "1", name: "Outright",
        startValue: 150000000, soldValue: 120000000,
        sqmSold: 1800, sqmRemaining: 1200,
        customers: 12, defaultedCount: 0, defaultedValue: 0, defaultedBalance: 0,
        terminatedCount: 0, terminatedValue: 0, terminatedBalance: 0,
        efficiency: 100,
      },
      {
        id: "2", name: "6 Months",
        startValue: 175000000, soldValue: 80000000,
        sqmSold: 2100, sqmRemaining: 3900,
        customers: 24, defaultedCount: 2, defaultedValue: 14600000, defaultedBalance: 6200000,
        terminatedCount: 1, terminatedValue: 7300000, terminatedBalance: 2800000,
        efficiency: 91,
      },
      {
        id: "3", name: "12 Months",
        startValue: 200000000, soldValue: 45000000,
        sqmSold: 1050, sqmRemaining: 600,
        customers: 30, defaultedCount: 5, defaultedValue: 38000000, defaultedBalance: 16400000,
        terminatedCount: 3, terminatedValue: 22000000, terminatedBalance: 9100000,
        efficiency: 78,
      },
    ],
  },
  {
    size: "300 SQM",
    totalSqm: 6900,
    plans: [
      {
        id: "4", name: "Outright",
        startValue: 350000000, soldValue: 350000000,
        sqmSold: 2400, sqmRemaining: 0,
        customers: 8, defaultedCount: 0, defaultedValue: 0, defaultedBalance: 0,
        terminatedCount: 0, terminatedValue: 0, terminatedBalance: 0,
        efficiency: 100,
      },
      {
        id: "5", name: "6 Months",
        startValue: 400000000, soldValue: 210000000,
        sqmSold: 3000, sqmRemaining: 1500,
        customers: 15, defaultedCount: 1, defaultedValue: 26700000, defaultedBalance: 11200000,
        terminatedCount: 2, terminatedValue: 53400000, terminatedBalance: 19800000,
        efficiency: 94,
      },
    ],
  },
  {
    size: "500 SQM",
    totalSqm: 7000,
    plans: [
      {
        id: "6", name: "Outright",
        startValue: 650000000, soldValue: 200000000,
        sqmSold: 2000, sqmRemaining: 5000,
        customers: 4, defaultedCount: 0, defaultedValue: 0, defaultedBalance: 0,
        terminatedCount: 0, terminatedValue: 0, terminatedBalance: 0,
        efficiency: 100,
      },
      {
        id: "7", name: "12 Months",
        startValue: 800000000, soldValue: 120000000,
        sqmSold: 4500, sqmRemaining: 2500,
        customers: 10, defaultedCount: 4, defaultedValue: 48000000, defaultedBalance: 21000000,
        terminatedCount: 2, terminatedValue: 24000000, terminatedBalance: 9600000,
        efficiency: 65,
      },
    ],
  },
];

function formatNaira(amount: number): string {
  if (amount === 0) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatSqm(sqm: number): string {
  if (sqm === 0) return "—";
  return `${sqm.toLocaleString()} SQM`;
}

export function PaymentPlanMatrix() {
  const [expandedSizes, setExpandedSizes] = useState<string[]>(MOCK_DATA.map((g) => g.size));

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
            {MOCK_DATA.map((group) => {
              const isOpen = expandedSizes.includes(group.size);
              const g = {
                startValue: group.plans.reduce((s, p) => s + p.startValue, 0),
                soldValue: group.plans.reduce((s, p) => s + p.soldValue, 0),
                sqmSold: group.plans.reduce((s, p) => s + p.sqmSold, 0),
                sqmRemaining: group.plans.reduce((s, p) => s + p.sqmRemaining, 0),
                customers: group.plans.reduce((s, p) => s + p.customers, 0),
                defaultedCount: group.plans.reduce((s, p) => s + p.defaultedCount, 0),
                defaultedValue: group.plans.reduce((s, p) => s + p.defaultedValue, 0),
                defaultedBalance: group.plans.reduce((s, p) => s + p.defaultedBalance, 0),
                terminatedCount: group.plans.reduce((s, p) => s + p.terminatedCount, 0),
                terminatedValue: group.plans.reduce((s, p) => s + p.terminatedValue, 0),
                terminatedBalance: group.plans.reduce((s, p) => s + p.terminatedBalance, 0),
              };

              return (
                <>
                  {/* Size group row */}
                  <TableRow
                    key={group.size}
                    className="bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleSize(group.size)}
                  >
                    <TableCell>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="font-black text-xs uppercase tracking-widest text-slate-900 whitespace-nowrap">
                      {group.size}
                    </TableCell>
                    <TableCell className="text-xs font-bold whitespace-nowrap">{formatNaira(g.startValue)}</TableCell>
                    <TableCell className="text-xs font-bold whitespace-nowrap">{formatNaira(g.soldValue)}</TableCell>
                    <TableCell className="text-xs font-bold whitespace-nowrap">{formatSqm(g.sqmSold)}</TableCell>
                    <TableCell className="text-xs font-bold whitespace-nowrap">{formatSqm(g.sqmRemaining)}</TableCell>
                    <TableCell className="text-xs font-bold tabular-nums">{g.customers}</TableCell>
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
                  {isOpen && group.plans.map((plan) => (
                    <TableRow key={plan.id} className="hover:bg-muted/20 border-l-2 border-l-primary/10">
                      <TableCell />
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold whitespace-nowrap">{plan.name}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Payment Scheme</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatNaira(plan.startValue)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatNaira(plan.soldValue)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSqm(plan.sqmSold)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSqm(plan.sqmRemaining)}</TableCell>
                      <TableCell className="text-sm font-bold tabular-nums">{plan.customers}</TableCell>
                      {/* Defaults */}
                      <TableCell className="border-l">
                        <span className={cn("text-sm font-bold", plan.defaultedCount > 0 ? "text-rose-600" : "text-muted-foreground")}>
                          {plan.defaultedCount || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-rose-600 whitespace-nowrap">{formatNaira(plan.defaultedValue)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-rose-500 whitespace-nowrap">{formatNaira(plan.defaultedBalance)}</TableCell>
                      {/* Terminations */}
                      <TableCell className="border-l">
                        <span className={cn("text-sm font-bold", plan.terminatedCount > 0 ? "text-amber-600" : "text-muted-foreground")}>
                          {plan.terminatedCount || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-amber-600 whitespace-nowrap">{formatNaira(plan.terminatedValue)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-amber-500 whitespace-nowrap">{formatNaira(plan.terminatedBalance)}</TableCell>
                      {/* Efficiency */}
                      <TableCell className="text-right border-l">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-bold">{plan.efficiency}%</span>
                          <div
                            className="h-1.5 w-16 bg-muted rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={plan.efficiency}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${plan.name} Collection Efficiency`}
                          >
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                plan.efficiency > 90 ? "bg-emerald-500" : plan.efficiency > 75 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${plan.efficiency}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
