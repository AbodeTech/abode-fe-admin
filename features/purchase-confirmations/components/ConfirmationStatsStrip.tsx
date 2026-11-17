"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfirmationCounts } from "../hooks/use-purchase-confirmations";

const CARDS = [
  { key: "disputed" as const, label: "Disputed", tone: "text-red-600" },
  { key: "waiting" as const, label: "Waiting", tone: "text-orange-600" },
  { key: "confirmed" as const, label: "Confirmed", tone: "text-green-600" },
  // Proposed BE count (item 11); the card only shows once the BE sends it.
  { key: "resolved" as const, label: "Disputes resolved", tone: "text-gray-900" },
];

export function ConfirmationStatsStrip() {
  const { data, isLoading } = useConfirmationCounts();
  const cards = CARDS.filter((card) => card.key !== "resolved" || data?.resolved !== undefined);

  return (
    <div
      className={`grid min-w-0 grid-cols-1 gap-3 sm:gap-4 ${cards.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}
    >
      {cards.map((card) => (
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
