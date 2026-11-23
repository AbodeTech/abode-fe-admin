"use client";

import { AlertTriangle, CheckCircle, Clock, Landmark, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { useRefundPayoutStats } from "../hooks/use-refund-payouts";

/**
 * GET /admin/refund-payouts/stats. Global, like the withdrawal cards: they describe every
 * refund, not the filtered table. "Owed" is what we still have to pay out.
 */
export function RefundPayoutStatCards() {
  const { data, isLoading, isError } = useRefundPayoutStats();
  if (isError) return null;

  if (isLoading || !data) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Owed to customers", bucket: data.owed, icon: Landmark },
    { title: "To send", bucket: data.pending, icon: Clock },
    { title: "With Paystack", bucket: data.processing, icon: Send },
    { title: "Needs retry", bucket: data.retry_needed, icon: AlertTriangle },
    { title: "Paid", bucket: data.paid, icon: CheckCircle },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.title} className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">{formatNaira(c.bucket.amount)}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {c.bucket.count.toLocaleString()} refund{c.bucket.count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
