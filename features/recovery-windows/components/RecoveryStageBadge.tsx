import { cn } from "@/lib/utils";

import type { RecoveryStage } from "../schemas/recovery-window.schema";
import { STAGE_LABEL, STAGE_TONE } from "./format";

export function RecoveryStageBadge({ stage, className }: { stage: RecoveryStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STAGE_TONE[stage],
        className
      )}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}

/** Days left as a bar: red under 14 days, amber under 30. */
export function DaysLeft({ days, ended }: { days: number; ended?: boolean }) {
  if (ended) return <span className="text-sm text-muted-foreground">Ended</span>;
  const pct = Math.max(4, Math.min(100, (days / 91) * 100));
  const tone = days <= 14 ? "bg-red-500" : days <= 30 ? "bg-amber-500" : "bg-teal-600";
  return (
    <div className="flex min-w-24 flex-col gap-1">
      <span className="text-sm font-semibold tabular-nums">
        {days} day{days === 1 ? "" : "s"}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
