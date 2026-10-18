import { FlaskConical } from 'lucide-react';

/**
 * One statement covering a whole tab, rather than a chip on every panel.
 *
 * Applied where the figures are fabricated (Performance, ticket 17b) or where
 * the data simply doesn't exist yet (Customers, ticket 17c). Nobody can be
 * looking at a number on these tabs without having passed this first.
 */
export function SampleDataBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
