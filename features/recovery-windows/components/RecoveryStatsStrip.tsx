"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useRecoveryStats } from "../hooks/use-recovery-windows";
import { naira } from "./format";

export function RecoveryStatsStrip() {
  const { data, isLoading } = useRecoveryStats();
  const cards = [
    {
      label: "In the window",
      value: data?.tabs.window ?? 0,
      sub: `${naira(data?.in_window_paid)} paid in`,
    },
    { label: "Requests to answer", value: data?.tabs.choices ?? 0, sub: "Send terms within 3 working days" },
    { label: "Move payments to approve", value: data?.tabs.payment ?? 0, sub: "On Asset transactions" },
    {
      label: "Refunds to approve",
      value: data?.tabs.refund ?? 0,
      sub: `${naira(data?.refunds_to_approve)} to credit`,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="min-w-0 border-none shadow-sm">
          <CardContent className="space-y-1 p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-12" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{card.sub}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
