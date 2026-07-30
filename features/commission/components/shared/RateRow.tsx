import { cn } from '@/lib/utils';

/**
 * Label left, figure right — the app's established key/value row.
 * `tabular-nums` keeps columns of rates aligned.
 */
export function RateRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-start justify-between gap-3 py-1.5', className)}>
      <span className="min-w-0 shrink text-sm text-muted-foreground">{label}</span>
      <span className="shrink-0 text-right text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
