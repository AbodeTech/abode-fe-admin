import { cn } from "@/lib/utils";
import type { SuspensionTone } from "../lib/format";
import type { RecoveryState } from "../schemas/financial-officer.schema";

/**
 * Recovery pills — shared by the plans table and the plan drawer so a plan
 * never reads one way in the table and another in the drawer.
 */

const PILL_BASE = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap";

const STATE_STYLES: Record<RecoveryState, { label: string; cls: string }> = {
  final_month: { label: "Final month", cls: "bg-amber-50 text-amber-700" },
  past_due: { label: "Past due", cls: "bg-red-50 text-[#AD1F2A]" },
  cleared: { label: "Cleared", cls: "bg-[#00695C] text-white" },
  suspended: { label: "Suspended", cls: "bg-gray-100 text-gray-700" },
};

export function RecoveryStatePill({ state }: { state: RecoveryState }) {
  const s = STATE_STYLES[state];
  return <span className={cn(PILL_BASE, s.cls)}>{s.label}</span>;
}

export function SuspensionPill({ label, tone }: { label: string; tone: SuspensionTone }) {
  if (tone === "urgent") return <span className={cn(PILL_BASE, "bg-red-50 text-[#AD1F2A]")}>{label}</span>;
  if (tone === "soon") return <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700")}>{label}</span>;
  return <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>;
}
