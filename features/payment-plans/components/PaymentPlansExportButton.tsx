'use client';

import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useExportPaymentPlans } from '../hooks/use-export-payment-plans';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';

export function PaymentPlansExportButton({
  canExport,
  filter,
}: {
  canExport: boolean;
  filter: FilterFormValues;
}) {
  const exportMutation = useExportPaymentPlans();

  if (!canExport) return null;

  return (
    <Button
      variant="outline"
      className="w-full shrink-0 sm:w-auto"
      disabled={exportMutation.isPending}
      onClick={() => exportMutation.mutate(filter)}
    >
      {exportMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export
        </>
      )}
    </Button>
  );
}
