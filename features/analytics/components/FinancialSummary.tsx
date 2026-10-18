"use client";

import { useSalesAnalyticsKpis, type SalesAnalyticsFilters } from "@/features/analytics";

interface FinancialSummaryProps {
  filters: SalesAnalyticsFilters;
}

export function FinancialSummary({ filters }: FinancialSummaryProps) {
  const { data: summary, isLoading, error } = useSalesAnalyticsKpis(filters);

  if (isLoading) {
    return <div className="h-48 w-full animate-pulse bg-muted rounded-xl" />;
  }

  if (error) {
    return (
      <div className="mx-6 my-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
        <h3 className="font-semibold">Unable to load sales KPIs</h3>
        <p className="text-sm">{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const paymentHealth = summary?.payment_health;
  const completed = paymentHealth?.completed || 0;
  const defaulted = paymentHealth?.defaulted || 0;
  const terminated = paymentHealth?.terminated || 0;
  const paymentHealthTotal = completed + defaulted + terminated;

  const completedWidth = paymentHealthTotal > 0 ? (completed / paymentHealthTotal) * 100 : 0;
  const defaultedWidth = paymentHealthTotal > 0 ? (defaulted / paymentHealthTotal) * 100 : 0;
  const terminatedWidth = paymentHealthTotal > 0 ? (terminated / paymentHealthTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-8 border-b">
      <div className="min-w-0 lg:col-span-5 flex flex-col justify-center">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
          Total Sales Value
        </span>
        <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter wrap-break-word">
          {formatCurrency(summary?.total_sales_value)}
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Active Transactions: {summary?.active_transactions || 0}</span>
        </div>
      </div>

      <div className="min-w-0 lg:col-span-4 grid grid-cols-2 gap-8 items-center border-l lg:px-8">
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expected</span>
          <span className="block text-2xl font-bold wrap-break-word">{formatCurrency(summary?.expected_amount)}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Received</span>
          <span className="block text-2xl font-bold text-emerald-600 wrap-break-word">{formatCurrency(summary?.total_received)}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Outstanding</span>
          <span className="block text-2xl font-bold text-amber-600 wrap-break-word">{formatCurrency(summary?.outstanding_balance)}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">SQM Sold</span>
          <span className="block text-2xl font-bold wrap-break-word">{Math.round(summary?.sqm_sold || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sqm</span></span>
        </div>
      </div>

      <div className="min-w-0 lg:col-span-3 flex flex-col justify-center border-l lg:pl-8">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Payment Health
        </span>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-emerald-500" style={{ width: `${completedWidth}%` }} />
          <div className="h-full bg-amber-500" style={{ width: `${defaultedWidth}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${terminatedWidth}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-y-2 gap-x-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Completed ({completed})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Defaulted ({defaulted})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-rose-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Terminated ({terminated})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
