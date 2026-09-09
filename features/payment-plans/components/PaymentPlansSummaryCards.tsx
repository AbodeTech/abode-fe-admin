'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNaira, formatNairaCompact } from '@/lib/utils/format';

import type { PaymentPlansSummary } from '../schemas/payment-plans-summary.schema';

const formatCount = (value: number) => new Intl.NumberFormat('en-NG').format(value);

function MoneyValue({ value }: { value: number }) {
  const full = formatNaira(value);
  return (
    <p className="min-w-0 font-bold tabular-nums leading-tight wrap-anywhere" title={full}>
      <span className="text-base sm:text-lg md:hidden">{formatNairaCompact(value)}</span>
      <span className="hidden text-lg lg:text-xl md:inline">{full}</span>
    </p>
  );
}

function CountValue({ value }: { value: number }) {
  return (
    <p className="min-w-0 text-base font-bold tabular-nums wrap-break-word sm:text-lg lg:text-xl">
      {formatCount(value)}
    </p>
  );
}

export function PaymentPlansSummaryCards({
  summary,
  isLoading,
}: {
  summary: PaymentPlansSummary | undefined;
  isLoading: boolean;
}) {
  const cards = [
    { label: 'Total plans', kind: 'count' as const, value: summary?.total_plans },
    { label: 'Total outstanding', kind: 'money' as const, value: summary?.total_outstanding },
    { label: 'Total paid', kind: 'money' as const, value: summary?.total_amount_paid },
    { label: 'Defaulted', kind: 'count' as const, value: summary?.defaulted_count },
    { label: 'Cancelled', kind: 'count' as const, value: summary?.cancelled_count },
    { label: 'Closed', kind: 'count' as const, value: summary?.closed_count },
    { label: 'Active', kind: 'count' as const, value: summary?.active_count },
  ];

  return (
    <div className="mb-4 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.label} className="min-w-0 overflow-hidden gap-3 py-4">
          <CardHeader className="px-3 pb-0 sm:px-4">
            <CardTitle className="text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 px-3 sm:px-4">
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : card.kind === 'money' ? (
              <MoneyValue value={card.value ?? 0} />
            ) : (
              <CountValue value={card.value ?? 0} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
