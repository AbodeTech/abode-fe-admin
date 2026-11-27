import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { REFUND_PAYOUT_STATUS_LABELS, type RefundPayoutStatus } from "../schemas/refund-payout.schema";

const TONE: Record<RefundPayoutStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  processing: "border-blue-200 bg-blue-50 text-blue-800",
  retry_needed: "border-red-200 bg-red-50 text-red-800",
  paid: "border-green-200 bg-green-50 text-green-800",
};

export function RefundPayoutStatusBadge({ status }: { status: RefundPayoutStatus }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", TONE[status])}>
      {REFUND_PAYOUT_STATUS_LABELS[status]}
    </Badge>
  );
}
