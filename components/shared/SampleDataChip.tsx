import { FlaskConical } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Marks a panel whose figures are fabricated because no backend endpoint
 * exists yet (asset analytics — ticket 17; withdrawal stats — ticket 13's
 * addendum).
 *
 * An em-dash reads as "unknown"; a chart reading "₦3.2bn sold" reads as a
 * fact — and demo screenshots get pasted into decks where nobody remembers
 * the caveat.
 *
 * Remove each usage alongside its sample data when the real endpoint lands.
 */
export function SampleDataChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground',
        className
      )}
      title="These figures are placeholders — no analytics endpoint exists yet"
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      Sample data
    </span>
  );
}
