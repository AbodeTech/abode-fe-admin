'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/shared/Pagination';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import { DEFAULT_PAYMENT_PLANS_LIMIT } from '../hooks/query-keys';
import { usePaymentPlans } from '../hooks/use-payment-plans';
import { usePaymentPlansSummary } from '../hooks/use-payment-plans-summary';
import { parseColumns, parseFilter } from '../lib/url-state';
import { PaymentPlansColumnChooser } from './PaymentPlansColumnChooser';
import { PaymentPlansFilterDrawer } from './PaymentPlansFilterDrawer';
import { PaymentPlansHeader } from './PaymentPlansHeader';
import { PaymentPlansPresetChips } from './PaymentPlansPresetChips';
import { PaymentPlansSummaryCards } from './PaymentPlansSummaryCards';
import { PaymentPlansTable } from './PaymentPlansTable';

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      {children}
    </div>
  );
}

export function PaymentPlansPage() {
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams);
  const columns = parseColumns(searchParams);
  const page = Number(searchParams.get('page')) || 1;

  const permissions = useAdminPermissions();
  const canView = permissions.has('view_payment_plans');
  const canExport = permissions.has('export_payment_plans');

  const { data, isLoading, isFetching, error } = usePaymentPlans({
    ...filter,
    page,
    limit: DEFAULT_PAYMENT_PLANS_LIMIT,
    enabled: canView,
  });
  const { data: summary, isLoading: summaryLoading } = usePaymentPlansSummary(filter, {
    enabled: canView,
  });

  if (!canView) {
    return (
      <PageShell>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">You do not have permission to view payment plans.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              An admin can grant the view_payment_plans permission.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PaymentPlansHeader
        totalCount={data?.meta?.total ?? 0}
        canExport={canExport}
        filter={filter}
      />

      <PaymentPlansPresetChips activeFilter={filter} />

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <PaymentPlansFilterDrawer filter={filter} />
        <PaymentPlansColumnChooser visibleColumns={columns} />
      </div>

      <PaymentPlansSummaryCards summary={summary} isLoading={!summary || summaryLoading} />

      <div className="min-w-0 overflow-x-auto">
        <PaymentPlansTable
          rows={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          isFetching={isFetching && !isLoading}
          error={error}
          filter={filter}
        />
      </div>

      <Pagination
        count={data?.meta?.total ?? 0}
        currentIdx={page}
        limit={DEFAULT_PAYMENT_PLANS_LIMIT}
      />
    </PageShell>
  );
}
