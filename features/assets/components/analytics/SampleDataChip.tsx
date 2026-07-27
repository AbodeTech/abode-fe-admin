import { FlaskConical } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Marks a panel whose figures are fabricated.
 *
 * There is no asset analytics endpoint yet (⛔ ticket 17), so these panels run
 * on `sample-data.ts`. An em-dash reads as "unknown"; a chart reading
 * "₦3.2bn sold" reads as a fact — and demo screenshots get pasted into decks
 * where nobody remembers the caveat.
 *
 * Remove this alongside the sample data when the endpoint lands.
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
