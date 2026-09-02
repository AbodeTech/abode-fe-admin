'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { COLUMNS, DEFAULT_SORT, type ColumnDef } from '../constants/columns';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';
import type { PaymentPlanRow } from '../schemas/payment-plan-row.schema';
import { PaymentPlansEmptyState } from './PaymentPlansEmptyState';
import { PaymentPlansErrorCard } from './PaymentPlansErrorCard';
import { PaymentPlansTableRow } from './PaymentPlansTableRow';

function sortKeyFor(col: ColumnDef): string {
  return col.sortKey ?? col.key;
}

function SortableColumnHeader({ column }: { column: ColumnDef }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('sort') ?? DEFAULT_SORT;
  const key = sortKeyFor(column);
  const isAsc = current === key;
  const isDesc = current === `-${key}`;

  if (!column.sortable) {
    return <span>{column.label}</span>;
  }

  const cycle = () => {
    const next = new URLSearchParams(params.toString());
    if (!isAsc && !isDesc) {
      next.set('sort', key);
    } else if (isAsc) {
      next.set('sort', `-${key}`);
    } else {
      next.delete('sort');
    }
    next.set('page', '1');
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const Icon = isAsc ? ArrowUp : isDesc ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {column.label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function TableSkeleton({ columns }: { columns: ColumnDef[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            ))}
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PaymentPlansTable({
  rows,
  columns,
  isLoading,
  isFetching,
  error,
  filter,
}: {
  rows: PaymentPlanRow[];
  columns: string[];
  isLoading: boolean;
  isFetching?: boolean;
  error: unknown;
  filter: FilterFormValues;
}) {
  if (error) return <PaymentPlansErrorCard error={error} />;

  const visibleColumns = COLUMNS.filter((c) => columns.includes(c.key));

  if (isLoading) return <TableSkeleton columns={visibleColumns} />;
  if (rows.length === 0) return <PaymentPlansEmptyState filter={filter} />;

  return (
    <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((col) => (
              <TableHead key={col.key}>
                <SortableColumnHeader column={col} />
              </TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <PaymentPlansTableRow key={row.id} row={row} visibleColumns={visibleColumns} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
