import { cn } from "@/lib/utils";

import { UPGRADE_STATUS_LABELS, type UpgradeStatus } from "../schemas/upgrade.schema";

/**
 * Follows the app's `TransactionStatus` pattern — complete literal class
 * strings per status, because Tailwind's JIT cannot see concatenated ones.
 */
const STATUS_STYLES: Record<UpgradeStatus, { wrapper: string; dot: string }> = {
  pending: {
    wrapper: "border-[#FEFCCA] bg-[#FEF3F2AB] text-[#B4A418]",
    dot: "bg-[#B4A418]",
  },
  approved: {
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]",
    dot: "bg-[#067647]",
  },
  declined: {
    wrapper: "border-[#FECDCA] bg-[#FEF3F2AB] text-[#B42318]",
    dot: "bg-[#B42318]",
  },
  cancelled: {
    wrapper: "border-[#E5EAEF] bg-[#F5F5F5] text-[#5A5A5A]",
    dot: "bg-[#5A5A5A]",
  },
};

export function UpgradeStatusBadge({
  status,
  className,
}: {
  status: UpgradeStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        style.wrapper,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} aria-hidden />
      {UPGRADE_STATUS_LABELS[status]}
    </span>
  );
}
