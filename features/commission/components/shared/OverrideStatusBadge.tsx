import { cn } from '@/lib/utils';

import type { OverrideStatus } from '../../schemas/override.schema';

/**
 * Follows the app's `TransactionStatus` pattern: complete literal class
 * strings per status, because Tailwind's JIT cannot see concatenated ones.
 *
 * Status is derived from `expires_at` / `revoked_at`, never stored.
 */
const STATUS_STYLES: Record<OverrideStatus, { label: string; wrapper: string; dot: string }> = {
  active: {
    label: 'Active',
    wrapper: 'border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]',
    dot: 'bg-[#067647]',
  },
  'expiring-soon': {
    label: 'Expiring soon',
    wrapper: 'border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]',
    dot: 'bg-[#B54708]',
  },
  expired: {
    label: 'Expired',
    wrapper: 'border-[#E5EAEF] bg-[#F5F5F5] text-[#5A5A5A]',
    dot: 'bg-[#5A5A5A]',
  },
  revoked: {
    label: 'Revoked',
    wrapper: 'border-[#FECDCA] bg-[#FEF3F2AB] text-[#B42318]',
    dot: 'bg-[#B42318]',
  },
};

export function OverrideStatusBadge({
  status,
  className,
}: {
  status: OverrideStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        style.wrapper,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}
