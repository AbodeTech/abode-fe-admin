"use client";

import { Activity, Briefcase, Ban } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { AgencyStats } from "../hooks/use-agency-stats";

/**
 * Agency counts, from `meta.total` on three cheap count-only list calls.
 *
 * v1's currency tiles (total sales volume, total commission paid) and its
 * platform-wide member count are gone: v2 exposes no aggregate that backs
 * them. Rendering them as ₦0 would read as real data, so they're omitted.
 */
interface AgencySystemMetricsProps {
  data?: AgencyStats | null;
  isLoading?: boolean;
}

const metricItems: {
  key: keyof AgencyStats;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "total", label: "Total Agencies", icon: Briefcase },
  { key: "active", label: "Active", icon: Activity },
  { key: "suspended", label: "Suspended", icon: Ban },
];

export function AgencySystemMetrics({ data, isLoading }: AgencySystemMetricsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-3 sm:gap-4">
      {metricItems.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.key} className="min-w-0 overflow-hidden border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="min-w-0 text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">
              {isLoading ? <Skeleton className="h-7 w-12" /> : (data?.[item.key] ?? 0)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
