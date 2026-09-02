import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesDashboardResponse } from "../schemas/sales.schema";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
    </div>
  );
}

function SalesCard({
  title,
  total,
  received,
  outstanding,
  accentColor,
  bgColor,
  progressColor,
}: {
  title: string;
  total: number;
  received: number;
  outstanding: number;
  accentColor: string;
  bgColor: string;
  progressColor: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className={`h-1.5 ${accentColor}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg p-3 ${bgColor}`}>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-xs font-semibold tabular-nums wrap-break-word sm:text-sm">
                {formatCurrency(received)}
              </p>
            </div>
            <ProgressBar value={received} max={total} color={progressColor} />
          </div>

          <div>
            <div className="mb-1 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-xs font-semibold tabular-nums wrap-break-word text-amber-600 sm:text-sm">
                {formatCurrency(outstanding)}
              </p>
            </div>
            <ProgressBar value={outstanding} max={total} color="bg-amber-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 4-card summary from GET /admin/sales/dashboard (S-2) — Overall, Flex,
 * Full-Ownership, Commercial. Developer plot has no card (S-1b — arbitrary
 * pricing would skew it); marketplace has its own reporting surface.
 */
export function SummaryCards({ data }: { data: SalesDashboardResponse }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:gap-4 lg:grid-cols-4">
      <SalesCard
        title="Overall"
        total={data.overall.total}
        received={data.overall.received}
        outstanding={data.overall.outstanding}
        accentColor="bg-primary"
        bgColor="bg-primary/5"
        progressColor="bg-primary"
      />
      <SalesCard
        title="Flex"
        total={data.flex.total}
        received={data.flex.received}
        outstanding={data.flex.outstanding}
        accentColor="bg-blue-500"
        bgColor="bg-blue-50"
        progressColor="bg-blue-500"
      />
      <SalesCard
        title="Full Ownership"
        total={data.full_ownership.total}
        received={data.full_ownership.received}
        outstanding={data.full_ownership.outstanding}
        accentColor="bg-green-500"
        bgColor="bg-green-50"
        progressColor="bg-green-500"
      />
      <SalesCard
        title="Commercial"
        total={data.commercial.total}
        received={data.commercial.received}
        outstanding={data.commercial.outstanding}
        accentColor="bg-purple-500"
        bgColor="bg-purple-50"
        progressColor="bg-purple-500"
      />
    </div>
  );
}
