"use client";

const MOCK_SUMMARY = {
  totalTransactionValue: 1850000000,
  expectedTransactionValue: 2100000000,
  totalReceivedTransactionValue: 1450000000,
  outstandingTransactionValue: 650000000,
  sqmSold: 12450,
};

export function FinancialSummary() {
  const summary = MOCK_SUMMARY;
  const isLoading = false;

  if (isLoading) {
    return <div className="h-48 w-full animate-pulse bg-muted rounded-xl" />;
  }

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-8 border-b">
      {/* Primary KPI */}
      <div className="lg:col-span-5 flex flex-col justify-center">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
          Total Sales Volume
        </span>
        <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter">
          {formatCurrency(summary?.totalTransactionValue)}
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
            ↑ 12% vs last period
          </span>
          <span className="text-xs text-muted-foreground">Adjusted for selected range</span>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="lg:col-span-4 grid grid-cols-2 gap-8 items-center border-l lg:px-8">
        <div>
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expected</span>
          <span className="text-2xl font-bold">{formatCurrency(summary?.expectedTransactionValue)}</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Received</span>
          <span className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalReceivedTransactionValue)}</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Outstanding</span>
          <span className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.outstandingTransactionValue)}</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">SQM Sold</span>
          <span className="text-2xl font-bold">{summary.sqmSold.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sqm</span></span>
        </div>
      </div>

      {/* Payment Health Bar */}
      <div className="lg:col-span-3 flex flex-col justify-center border-l lg:pl-8">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Payment Health
        </span>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-emerald-500" style={{ width: "65%" }} />
          <div className="h-full bg-blue-500" style={{ width: "15%" }} />
          <div className="h-full bg-amber-500" style={{ width: "10%" }} />
          <div className="h-full bg-orange-500" style={{ width: "7%" }} />
          <div className="h-full bg-rose-500" style={{ width: "3%" }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Completed (65%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Grace (15%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Missed (10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-rose-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Late (3%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
