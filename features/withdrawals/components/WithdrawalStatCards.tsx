"use client";

import { AlertTriangle, CheckCircle, Clock, Wallet, XCircle, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleDataChip } from "@/components/shared/SampleDataChip";

/* ============================================================
 * The summary cards the old withdrawal screen had, on fixtures.
 *
 * Mirrors v1's `adminTransactionDataPoint(type: "debit")` card set —
 * pending / approved / rejected / auto-approved / auto-failed counts plus
 * the users' wallet balance. The pending card also carries the ₦ value of
 * what's awaiting review, since that is the number an admin clearing the
 * queue actually plans around.
 *
 * ⛔ ticket 13 addendum — abode-be-v2 has no stats endpoint for this queue
 * (the old cards hit v1's REST client, which is gone). The visuals stay so
 * the page reads as designed, every figure below is invented, and each card
 * carries the chip that says so.
 *
 * Deliberately NOT derived from the queue responses: counting one page of
 * 20 rows and presenting it as "pending transactions" would be a confident
 * wrong number — worse than a labelled fake one.
 *
 * Delete this file when the endpoint lands. Amounts are decimal naira.
 * ============================================================ */

const SAMPLE_STATS = [
  { title: "Pending review", value: "14", sub: "₦6,430,000 awaiting", icon: Clock },
  { title: "Approved", value: "126", icon: CheckCircle },
  { title: "Rejected", value: "9", icon: XCircle },
  { title: "Auto-approved", value: "312", icon: Zap },
  { title: "Auto-failed", value: "4", icon: AlertTriangle },
  { title: "Users' wallet balance", value: "₦84,200,000", icon: Wallet },
] as const;

export function WithdrawalStatCards() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLE_STATS.map((stat) => (
        <Card key={stat.title} className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              {"sub" in stat ? (
                <p className="text-xs text-muted-foreground tabular-nums">{stat.sub}</p>
              ) : null}
            </div>
            <SampleDataChip />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
