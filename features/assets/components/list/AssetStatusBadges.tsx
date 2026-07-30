import { cn } from '@/lib/utils';

import { VISIBILITY_LABELS, type Visibility } from '../../schemas/asset.schema';

/**
 * Visibility and sold-out are independent axes — an asset can be `public` and
 * `sold`, or `draft` and not. Two chips rather than one conflated status.
 *
 * Literal class strings per state, following the app's `TransactionStatus`
 * pattern: Tailwind's JIT cannot see concatenated ones.
 */
const VISIBILITY_STYLES: Record<Visibility, string> = {
  draft: 'border-[#E5EAEF] bg-[#F5F5F5] text-[#5A5A5A]',
  internal: 'border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]',
  public: 'border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]',
};

export function AssetStatusBadges({
  visibility,
  sold,
  deletedAt,
  className,
}: {
  visibility: Visibility;
  sold: boolean;
  deletedAt?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium',
          VISIBILITY_STYLES[visibility]
        )}
      >
        {VISIBILITY_LABELS[visibility]}
      </span>

      {sold ? (
        <span className="inline-flex shrink-0 items-center rounded-full border border-[#FECDCA] bg-[#FEF3F2AB] px-2 py-0.5 text-xs font-medium text-[#B42318]">
          Sold out
        </span>
      ) : null}

      {/* Only visible when the list is showing deleted rows. */}
      {deletedAt ? (
        <span className="inline-flex shrink-0 items-center rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Deleted
        </span>
      ) : null}
    </div>
  );
}
