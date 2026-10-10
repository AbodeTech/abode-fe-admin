import { AlertCircle, Check, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { statusLabel } from "../lib/format";

/**
 * Outbound delivery, drawn the way WhatsApp itself draws it — one tick sent,
 * two delivered, two highlighted read — so support reads it without a legend.
 * `undelivered` and `failed` get the alert glyph. Inbound statuses render
 * nothing here; their failures are shown on the message itself.
 *
 * `onDark` is for the solid outbound bubble, where grey and teal disappear.
 */
export function DeliveryTicks({
  status,
  onDark = false,
  className,
}: {
  status: string | null | undefined;
  onDark?: boolean;
  className?: string;
}) {
  const label = statusLabel(status);
  const base = cn("h-3.5 w-3.5 shrink-0", className);
  const muted = onDark ? "text-white/60" : "text-gray-400";
  const read = onDark ? "text-[#80DEEA]" : "text-[#00695C]";
  const alert = onDark ? "text-red-200" : "text-[#AD1F2A]";

  switch (status) {
    case "sent":
      return <Check className={cn(base, muted)} aria-label={label} />;
    case "delivered":
      return <CheckCheck className={cn(base, muted)} aria-label={label} />;
    case "read":
      return <CheckCheck className={cn(base, read)} aria-label={label} />;
    case "undelivered":
    case "failed":
      return <AlertCircle className={cn(base, alert)} aria-label={label} />;
    default:
      return null;
  }
}
