"use client";

import type { ComponentType, ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * One headline number: label, value, a note. Values use proportional figures —
 * `tabular-nums` makes a standalone number read loose at this size.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  note,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="min-w-0 gap-0 border-border bg-card py-0 shadow-none">
      <CardContent className="flex min-w-0 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 break-words text-2xl font-semibold text-foreground">{value}</div>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}

export function StatTileSkeleton() {
  return <Skeleton className="h-[104px] w-full rounded-xl" />;
}
