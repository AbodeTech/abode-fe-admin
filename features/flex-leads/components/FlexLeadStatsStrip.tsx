"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useFlexLeadCounts } from "../hooks/use-flex-leads";

const CARDS = [
  { key: "new" as const, label: "New", tone: "text-blue-600" },
  { key: "contacted" as const, label: "Contacted", tone: "text-orange-600" },
  { key: "scheduled" as const, label: "Scheduled", tone: "text-violet-600" },
  { key: "completed" as const, label: "Completed", tone: "text-green-600" },
  { key: "closed" as const, label: "Closed", tone: "text-slate-600" },
];

/** Real per-status counts from GET /admin/flex-leads/counts. */
export function FlexLeadStatsStrip() {
  const { data, isLoading } = useFlexLeadCounts();

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {CARDS.map((card) => (
        <Card key={card.key} className="min-w-0 border-none shadow-sm">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${card.tone}`}>
                  {data?.[card.key] ?? 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
