'use client';

import { PaymentPlansColumnChooser } from './PaymentPlansColumnChooser';
import { PaymentPlansExportButton } from './PaymentPlansExportButton';
import { PaymentPlansFilterDrawer } from './PaymentPlansFilterDrawer';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';

export function PaymentPlansHeader({
  totalCount,
  canExport,
  filter,
  visibleColumns,
}: {
  totalCount: number;
  canExport: boolean;
  filter: FilterFormValues;
  visibleColumns: string[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Payment Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {new Intl.NumberFormat('en-NG').format(totalCount)} plans
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
        <PaymentPlansFilterDrawer filter={filter} />
        <PaymentPlansColumnChooser visibleColumns={visibleColumns} />
        <PaymentPlansExportButton canExport={canExport} filter={filter} />
      </div>
    </div>
  );
}
