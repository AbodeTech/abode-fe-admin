"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PageContentLoaderProps = {
  /** Shown under the spinner; omit for spinner-only. */
  label?: string;
  className?: string;
};

/**
 * Centered loading state for dashboard main content.
 * Use for full-section loads instead of a small row at the bottom of the page.
 */
export function PageContentLoader({ label = "Loading…", className }: PageContentLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3",
        "min-h-[min(60vh,28rem)] py-16",
        className
      )}
    >
      <Loader2 className="h-10 w-10 shrink-0 animate-spin text-primary" aria-hidden />
      {label ? <p className="text-center text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}

/** Default fallback for dashboard `Suspense` boundaries (compact but centered). */
export function SuspensePageFallback() {
  return <PageContentLoader label="Loading…" className="min-h-[min(45vh,20rem)] py-12" />;
}
