import { cn } from "@/lib/utils";

/**
 * The asset-detail design's read-only panel: a bordered box with a title,
 * a one-line caption and an optional action on the right. `EditablePanel` is
 * its editing sibling — use that one when the panel swaps to a form.
 */
export function DetailPanel({
  title,
  description,
  action,
  children,
  flush = false,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Drop the body padding — for a table that runs edge to edge. */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </header>
      <div className={flush ? undefined : "p-4"}>{children}</div>
    </section>
  );
}
