import { User, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * How the payout was processed — the rail took it unattended, or an admin
 * pushed it through.
 *
 * One deliberate difference from the screen this replaces: that one rendered
 * "Manual" for anything that wasn't `'auto'`, **including null**. In v2
 * `processing_type` defaults to null and is only set once the withdrawal is
 * actually processed, so a pending row has no method yet — labelling it
 * "Manual" would state that a human handled something nobody has touched.
 * Null renders as an em-dash.
 */
export function ProcessingMethodBadge({ type }: { type?: "auto" | "manual" | null }) {
  if (!type) {
    return (
      <span className="text-sm text-muted-foreground" aria-label="Not processed yet">
        —
      </span>
    );
  }

  const auto = type === "auto";

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        auto
          ? "border-[#C7D7FE] bg-[#EEF4FF] text-[#3538CD]"
          : "border-[#E4E7EC] bg-[#F9FAFB] text-[#667085]"
      )}
    >
      {auto ? (
        <Zap className="h-2.5 w-2.5 shrink-0" aria-hidden />
      ) : (
        <User className="h-2.5 w-2.5 shrink-0" aria-hidden />
      )}
      {auto ? "Auto" : "Manual"}
    </span>
  );
}
