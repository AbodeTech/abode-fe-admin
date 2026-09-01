"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  narrow,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto mt-4 w-full min-w-0 space-y-6 px-3 pb-16 sm:px-4 sm:pb-20",
        narrow ? "max-w-4xl" : "max-w-[1600px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Header({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight wrap-break-word">{title}</h1>
        {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children ? <div className="w-full shrink-0 sm:w-auto">{children}</div> : null}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg border bg-muted/40" />
      ))}
    </div>
  );
}

export function WizardHeader({
  steps,
  currentIndex,
}: {
  steps: readonly string[];
  currentIndex: number;
}) {
  return (
    <ol className="flex min-w-0 flex-wrap gap-2">
      {steps.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li
            key={step}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize",
              active && "border-foreground bg-foreground text-background",
              done && "border-primary/40 text-foreground",
              !active && !done && "text-muted-foreground"
            )}
          >
            {index + 1}. {step}
          </li>
        );
      })}
    </ol>
  );
}

export function WizardFooter({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}
