"use client";

import { CheckCircle, Clock, Repeat, ShoppingCart, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleDataChip } from "@/components/shared/SampleDataChip";

/* ============================================================
 * The summary cards the old asset-transactions screen had, on fixtures.
 *
 * v1's stats query summed approved / pending / declined values and split
 * sales into new vs recurring and flex vs full-ownership. abode-be-v2 has no
 * stats endpoint for transactions at all, so the visuals stay on invented
 * figures, each carrying the chip that says so.
 *
 * The full-ownership card reads ₦0 — truthfully, for once: no full-ownership
 * purchase flow exists on the backend, so there is nothing it could sum.
 *
 * Delete this file when the endpoint lands. Amounts are decimal naira.
 * ============================================================ */

const SAMPLE_STATS = [
  { title: "Approved value", value: "₦412,600,000", icon: CheckCircle },
  { title: "Pending value", value: "₦28,400,000", sub: "11 awaiting review", icon: Clock },
  { title: "Declined value", value: "₦9,100,000", icon: XCircle },
  { title: "New sales", value: "₦186,000,000", sub: "43 purchases", icon: ShoppingCart },
  { title: "Recurring payments", value: "₦226,600,000", sub: "312 installments", icon: Repeat },
  { title: "Full-ownership sales", value: "₦0", sub: "no purchase flow yet", icon: ShoppingCart },
] as const;

export function PurchaseStatCards() {
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
