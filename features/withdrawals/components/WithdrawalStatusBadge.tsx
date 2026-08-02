import { cn } from "@/lib/utils";

import {
  ADMIN_STATUS_LABELS,
  TRANSACTION_STATUS_LABELS,
  type AdminStatus,
  type TransactionStatus,
} from "../schemas/withdrawal.schema";

/**
 * Complete literal class strings per status — Tailwind's JIT cannot see
 * concatenated ones. Palette follows `UpgradeStatusBadge`.
 */
const ADMIN_STATUS_STYLES: Record<AdminStatus, { wrapper: string; dot: string }> = {
  pending: {
    wrapper: "border-[#FEFCCA] bg-[#FEF3F2AB] text-[#B4A418]",
    dot: "bg-[#B4A418]",
  },
  "auto-approved": {
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]",
    dot: "bg-[#067647]",
  },
  approved: {
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]",
    dot: "bg-[#067647]",
  },
  "approved-retry-needed": {
    wrapper: "border-[#FEDF89] bg-[#FFFAEBAB] text-[#B54708]",
    dot: "bg-[#B54708]",
  },
  declined: {
    wrapper: "border-[#FECDCA] bg-[#FEF3F2AB] text-[#B42318]",
    dot: "bg-[#B42318]",
  },
  failed: {
    wrapper: "border-[#FECDCA] bg-[#FEF3F2AB] text-[#B42318]",
    dot: "bg-[#B42318]",
  },
};

export function WithdrawalStatusBadge({
  status,
  className,
}: {
  status: AdminStatus;
  className?: string;
}) {
  const style = ADMIN_STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        style.wrapper,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} aria-hidden />
      {ADMIN_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * The money's own state, shown as muted text beneath the review badge when it
 * adds information — `processing` after approval, `completed` once the
 * provider webhook lands.
 */
export function MoneyState({ status }: { status: TransactionStatus }) {
  if (status === "pending") return null;
  return (
    <p className="text-xs text-muted-foreground">{TRANSACTION_STATUS_LABELS[status]}</p>
  );
}
