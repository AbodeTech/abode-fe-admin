import { cn } from "@/lib/utils";

import {
  PURCHASE_STATUS_LABELS,
  isReviewablePurchase,
  type Purchase,
  type PurchaseStatus,
} from "../schemas/purchase.schema";

/** Complete literal class strings — Tailwind's JIT cannot see concatenated ones. */
const STATUS_STYLES: Record<PurchaseStatus, { wrapper: string; dot: string }> = {
  pending: {
    wrapper: "border-[#FEFCCA] bg-[#FEF3F2AB] text-[#B4A418]",
    dot: "bg-[#B4A418]",
  },
  processing: {
    wrapper: "border-[#B2DDFF] bg-[#EFF8FFAB] text-[#175CD3]",
    dot: "bg-[#175CD3]",
  },
  completed: {
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]",
    dot: "bg-[#067647]",
  },
  failed: {
    wrapper: "border-[#FECDCA] bg-[#FEF3F2AB] text-[#B42318]",
    dot: "bg-[#B42318]",
  },
  cancelled: {
    wrapper: "border-[#E5EAEF] bg-[#F5F5F5] text-[#5A5A5A]",
    dot: "bg-[#5A5A5A]",
  },
};

export function PurchaseStatusBadge({
  status,
  className,
}: {
  status: PurchaseStatus;
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
      {PURCHASE_STATUS_LABELS[status]}
    </span>
  );
}

/** A pending transfer is work waiting for an admin — say so beneath the badge. */
export function ReviewHint({ row }: { row: Purchase }) {
  if (!isReviewablePurchase(row)) return null;
  return <p className="text-xs font-medium text-[#B54708]">Needs review</p>;
}
