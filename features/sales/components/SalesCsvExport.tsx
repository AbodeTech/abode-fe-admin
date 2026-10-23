'use client';

import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/hooks/use-admin-permission';

import { useSalesCsvExport } from '../hooks/use-sales-csv-export';
import type { SalesListFilters } from '../hooks/use-sales';

/**
 * Server-side CSV downloads, shown by permission: `export_sales` for the standard
 * file, `export_sales_pii` for the one with buyer details. Super Admin holds both
 * through `useHasPermission`'s bypass.
 */
export function SalesCsvExport({ filters }: { filters: SalesListFilters }) {
  const canExport = useHasPermission('export_sales');
  const canExportPii = useHasPermission('export_sales_pii');
  const { mutateAsync: exportCsv, isPending, variables } = useSalesCsvExport();

  if (!canExport && !canExportPii) return null;

  const handleDownload = async (withPii: boolean) => {
    try {
      await exportCsv({ filters, withPii });
      toast.success('Sales CSV downloaded');
    } catch (err) {
      const message = (err as Error).message || '';
      if (/EXPORT_TOO_LARGE|too many rows/i.test(message)) {
        toast.error('Too many rows to export — narrow your date range or filters.');
      } else {
        toast.error(message || 'Failed to export sales.');
      }
    }
  };

  const renderButton = (withPii: boolean, label: string) => {
    const busy = isPending && variables?.withPii === withPii;
    return (
      <Button
        variant="outline"
        onClick={() => handleDownload(withPii)}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {busy ? 'Preparing...' : label}
      </Button>
    );
  };

  return (
    <>
      {canExport && renderButton(false, 'Download CSV')}
      {canExportPii && renderButton(true, 'Download CSV (with buyer details)')}
    </>
  );
}
