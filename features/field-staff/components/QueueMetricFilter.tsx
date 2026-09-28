"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { FIELD_STAFF_TYPE_LABELS } from "../schemas/field-staff.schema";
import { FIELD_METRIC_KEYS, HIDDEN_METRIC_KEYS, type FieldMetricKey } from "../schemas/scorecard.schema";
import { useFieldMetrics } from "../hooks/use-field-scorecards";

const ALL = "all";

/** Reads `?metric=`; anything unrecognised means every metric. */
export function useQueueMetric(): FieldMetricKey | undefined {
  const value = useSearchParams().get("metric");
  return FIELD_METRIC_KEYS.find((key) => key === value);
}

/** Narrow the review queue to one kind of work. The API filters by metric, not by role. */
export function QueueMetricFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = useQueueMetric();
  const metrics = useFieldMetrics();

  const select = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ALL) params.delete("metric");
    else params.set("metric", next);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={active ?? ALL} onValueChange={select} disabled={metrics.isLoading}>
      <SelectTrigger className="w-fit min-w-56 bg-white" aria-label="Kind of work">
        <SelectValue placeholder="All work" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All work</SelectItem>
        {(metrics.data?.metrics ?? []).filter((m) => !HIDDEN_METRIC_KEYS.includes(m.key)).map((m) => (
          <SelectItem key={m.key} value={m.key}>
            {m.label}
            <span className="ml-1.5 text-xs text-muted-foreground">· {FIELD_STAFF_TYPE_LABELS[m.staff_type]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
