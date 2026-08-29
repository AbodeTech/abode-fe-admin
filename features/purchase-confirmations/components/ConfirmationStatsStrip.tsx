"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfirmationCounts } from "../hooks/use-purchase-confirmations";

const CARDS = [
  { key: "disputed" as const, label: "Disputed", tone: "text-red-600" },
  { key: "waiting" as const, label: "Waiting", tone: "text-orange-600" },
  { key: "confirmed" as const, label: "Confirmed", tone: "text-green-600" },
];

export function ConfirmationStatsStrip() {
  const { data, isLoading } = useConfirmationCounts();

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
