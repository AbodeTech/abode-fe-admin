"use client";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, PieChart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PaymentPlan {
  id: string;
  name: string;
  startValue: number;
  soldValue: number;
  customers: number;
  defaulted: number;
  efficiency: number;
}

interface SizeGroup {
  size: string;
  plans: PaymentPlan[];
}

const MOCK_DATA: SizeGroup[] = [
  {
    size: "150 SQM",
    plans: [
      { id: "1", name: "Outright", startValue: 150000000, soldValue: 120000000, customers: 12, defaulted: 0, efficiency: 100 },
      { id: "2", name: "6 Months", startValue: 175000000, soldValue: 80000000, customers: 24, defaulted: 2, efficiency: 91 },
      { id: "3", name: "12 Months", startValue: 200000000, soldValue: 45000000, customers: 30, defaulted: 5, efficiency: 78 },
    ]
  },
  {
    size: "300 SQM",
    plans: [
      { id: "4", name: "Outright", startValue: 350000000, soldValue: 350000000, customers: 8, defaulted: 0, efficiency: 100 },
      { id: "5", name: "6 Months", startValue: 400000000, soldValue: 210000000, customers: 15, defaulted: 1, efficiency: 94 },
    ]
  },
  {
    size: "500 SQM",
    plans: [
      { id: "6", name: "Outright", startValue: 650000000, soldValue: 200000000, customers: 4, defaulted: 0, efficiency: 100 },
      { id: "7", name: "12 Months", startValue: 800000000, soldValue: 120000000, customers: 10, defaulted: 4, efficiency: 65 },
    ]
  }
];

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentPlanMatrix() {
  const [expandedSizes, setExpandedSizes] = useState<string[]>(MOCK_DATA.map(g => g.size));

  const toggleSize = (size: string) => {
    setExpandedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
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

      <div className="rounded-2xl border border-border/50 bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[10px]"></TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Plan Type / Size</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden sm:table-cell">Start Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Sold Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden md:table-cell">Customer Count</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden lg:table-cell">Defaults</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-right">Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_DATA.map((group) => {
              const isOpen = expandedSizes.includes(group.size);
              const groupStartValue = group.plans.reduce((sum, p) => sum + p.startValue, 0);
              const groupSoldValue = group.plans.reduce((sum, p) => sum + p.soldValue, 0);
              const groupCustomers = group.plans.reduce((sum, p) => sum + p.customers, 0);
              const groupDefaults = group.plans.reduce((sum, p) => sum + p.defaulted, 0);

              return (
                <>
                  <TableRow 
                    key={group.size} 
                    className="bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleSize(group.size)}
                  >
                    <TableCell>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="font-black text-xs uppercase tracking-widest text-slate-900">
                      {group.size}
                    </TableCell>
                    <TableCell className="text-xs font-bold hidden sm:table-cell">{formatNaira(groupStartValue)}</TableCell>
                    <TableCell className="text-xs font-bold">{formatNaira(groupSoldValue)}</TableCell>
                    <TableCell className="text-xs font-bold hidden md:table-cell">{groupCustomers}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-600 hidden lg:table-cell">{groupDefaults}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {isOpen && group.plans.map((plan) => (
                    <TableRow key={plan.id} className="hover:bg-muted/20 border-l-2 border-l-primary/10">
                      <TableCell></TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{plan.name}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Payment Scheme</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums hidden sm:table-cell">{formatNaira(plan.startValue)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">{formatNaira(plan.soldValue)}</TableCell>
                      <TableCell className="text-sm font-bold hidden md:table-cell">{plan.customers}</TableCell>
                      <TableCell className="text-sm font-bold text-rose-500 hidden lg:table-cell">{plan.defaulted}</TableCell>
                      <TableCell className="text-right">
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
                                plan.efficiency > 90 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]" : plan.efficiency > 75 ? "bg-amber-500" : "bg-rose-500"
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
