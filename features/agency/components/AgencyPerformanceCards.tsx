"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useAgencyPerformance } from "../hooks/use-agency-performance";

const naira = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

const count = (value: number | null) => (value === null ? "—" : value.toLocaleString());

/**
 * Lifetime sales figures for one agency (item 8). Rendered only when the
 * `agency_stats` endpoint is ready; a failed load says so instead of showing zeros.
 */
export function AgencyPerformanceCards({ agencyId }: { agencyId: string }) {
  const { data, isLoading, error } = useAgencyPerformance(agencyId);

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        Couldn&apos;t load this agency&apos;s sales figures.
      </p>
    );
  }

  const cards = [
    { label: "Sales value", value: naira(data?.sales_value ?? null), sub: `${count(data?.buyers ?? null)} buyers` },
    { label: "Received", value: naira(data?.amount_received ?? null), sub: `${naira(data?.outstanding ?? null)} outstanding` },
    {
      label: "Land sold",
      value: data?.sqm_sold === null || data?.sqm_sold === undefined ? "—" : `${data.sqm_sold.toLocaleString()} sqm`,
      sub: `${count(data?.units_sold ?? null)} units`,
    },
    {
      label: "Commission paid",
      value: naira(data?.commission_paid ?? null),
      sub: `${naira(data?.commission_projected ?? null)} still to come`,
    },
    {
      label: "Active members",
      value: count(data?.active_members ?? null),
      sub: `of ${count(data?.members ?? null)} members`,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="min-w-0 border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <>
                <p className="wrap-break-word text-lg font-semibold tabular-nums sm:text-xl">{card.value}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{card.sub}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
