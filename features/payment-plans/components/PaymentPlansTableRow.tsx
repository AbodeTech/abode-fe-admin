'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatNaira } from '@/lib/utils/format';

import type { ColumnDef } from '../constants/columns';
import { buyerLabel, hasReferrer, referrerLabel } from '../lib/display';
import type { PaymentPlanRow } from '../schemas/payment-plan-row.schema';
import { PaymentPlansStatusBadge } from './PaymentPlansStatusBadge';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy');
}

function formatAssetType(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ');
}

function renderCell(col: ColumnDef, row: PaymentPlanRow) {
  switch (col.key) {
    case 'user':
      return buyerLabel(row.user);
    case 'referrer':
      return hasReferrer(row.referrer) ? referrerLabel(row.referrer) : '—';
    case 'asset':
      return row.asset.asset_name || '—';
    case 'asset_type':
      return formatAssetType(row.asset.asset_type);
    case 'status':
      return <PaymentPlansStatusBadge status={row.status} />;
    case 'no_of_units':
      return row.no_of_units ?? '—';
    case 'size':
      return row.size ?? '—';
    case 'amount_payable':
      return formatNaira(row.amount_payable);
    case 'amount_paid':
      return formatNaira(row.amount_paid);
    case 'outstanding':
      return formatNaira(row.balance);
    case 'default_amount':
      return formatNaira(row.default_amount);
    case 'default_count':
      return row.default_count ?? '—';
    case 'months_overdue':
      return row.months_overdue ?? '—';
    case 'next_payment':
      return formatDate(row.next_date_of_payment);
    case 'start_date':
      return formatDate(row.start_date);
    case 'completed_at':
      return formatDate(row.plan_completed_at);
    case 'suspended_at':
      return formatDate(row.suspended_at);
    case 'cancelled_at':
      return formatDate(row.cancelled_at);
    case 'suspension_reason':
      return row.suspension_reason || '—';
    case 'cancellation_reason':
      return row.cancellation_reason || '—';
    case 'contract_signed':
      return row.contract_signed ? 'Yes' : 'No';
    case 'created':
      return formatDate(row.createdAt);
    default:
      return '—';
  }
}

export function PaymentPlansTableRow({
  row,
  visibleColumns,
}: {
  row: PaymentPlanRow;
  visibleColumns: ColumnDef[];
}) {
  const router = useRouter();
  const userId = row.user.user_id;
  const href = userId ? `/users/${userId}` : null;

  return (
    <TableRow
      className={href ? 'cursor-pointer' : undefined}
      onClick={href ? () => router.push(href) : undefined}
    >
      {visibleColumns.map((col) => (
        <TableCell key={col.key}>{renderCell(col, row)}</TableCell>
      ))}
      <TableCell onClick={(e) => e.stopPropagation()}>
        {href ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>View</Link>
          </Button>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
