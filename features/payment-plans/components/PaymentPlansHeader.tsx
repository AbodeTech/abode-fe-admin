'use client';

import { PaymentPlansExportButton } from './PaymentPlansExportButton';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';

export function PaymentPlansHeader({
  totalCount,
  canExport,
  filter,
}: {
  totalCount: number;
  canExport: boolean;
  filter: FilterFormValues;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Payment Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {new Intl.NumberFormat('en-NG').format(totalCount)} plans
        </p>
      </div>
      <PaymentPlansExportButton canExport={canExport} filter={filter} />
    </div>
  );
}
